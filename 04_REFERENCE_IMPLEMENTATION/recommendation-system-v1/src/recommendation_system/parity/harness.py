from __future__ import annotations
import csv
import importlib.util
import json
import sys
import math
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

from recommendation_system.core.service import RecommendationCoreService

DECISION_FIELDS = [
    "Resolution_Type", "Resolution_ID", "Selected_KCR_IDs", "Evidence_Node_IDs",
    "Scope_Status", "Recommended_SCR_ID", "Promoted_SCR_IDs", "Decision_Status",
    "Negation_Vetoed_SCR_IDs",
]
NUMERIC_FIELDS = ["Scope_Mismatch_Sibling_Score", "Direct_Anchor_Score"]

@dataclass
class CaseParity:
    test_id: str
    passed: bool
    mismatches: list[str]

class ParityHarness:
    def __init__(self, reference_runtime_path: str | Path, repository_dir: str | Path,
                 *, backend: str = "lsa", float_tolerance: float = 1e-6,
                 model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.reference_runtime_path = Path(reference_runtime_path)
        self.repository_dir = Path(repository_dir)
        self.backend = backend
        self.float_tolerance = float_tolerance
        self.model_name = model_name
        self.reference = self._load_reference()
        self.candidate = RecommendationCoreService(self.repository_dir, backend=backend, model_name=model_name)

    def _load_reference(self):
        spec = importlib.util.spec_from_file_location("design8a_reference", self.reference_runtime_path)
        if spec is None or spec.loader is None:
            raise RuntimeError("Cannot load reference runtime")
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)
        cfg = module.RuntimeConfig(semantic_backend=self.backend, model_name=self.model_name)
        return module.HybridRuntime(str(self.repository_dir), cfg)

    @staticmethod
    def _load_cases(path: str | Path) -> list[dict[str, str]]:
        with Path(path).open(encoding="utf-8-sig", newline="") as f:
            return list(csv.DictReader(f))

    def _compare(self, ref: dict[str, Any], cand: dict[str, Any]) -> CaseParity:
        mismatches: list[str] = []
        for field in DECISION_FIELDS:
            if ref.get(field) != cand.get(field):
                mismatches.append(f"{field}: reference={ref.get(field)!r}, candidate={cand.get(field)!r}")
        for field in NUMERIC_FIELDS:
            a, b = float(ref.get(field, 0.0) or 0.0), float(cand.get(field, 0.0) or 0.0)
            if not math.isclose(a, b, rel_tol=0.0, abs_tol=self.float_tolerance):
                mismatches.append(f"{field}: reference={a}, candidate={b}, delta={abs(a-b)}")
        # Structured trace payloads should also remain identical in same-backend Python migration.
        for field in ["Mechanism_Facets_JSON", "Promotion_Facets_JSON", "Negative_Promotion_Facets_JSON", "Top_Candidates_JSON"]:
            if ref.get(field) != cand.get(field):
                mismatches.append(f"{field}: structured trace differs")
        return CaseParity(test_id=str(ref.get("Test_ID", "")), passed=not mismatches, mismatches=mismatches)

    def run(self, cases_csv: str | Path) -> dict[str, Any]:
        results: list[CaseParity] = []
        for case in self._load_cases(cases_csv):
            ref = self.reference.predict(dict(case))
            cand = self.candidate.recommend(dict(case))
            results.append(self._compare(ref, cand))
        return {
            "backend": self.backend,
            "case_count": len(results),
            "passed_count": sum(1 for r in results if r.passed),
            "failed_count": sum(1 for r in results if not r.passed),
            "passed": all(r.passed for r in results),
            "cases": [asdict(r) for r in results],
        }

    def run_and_write(self, cases_csv: str | Path, output_json: str | Path) -> dict[str, Any]:
        report = self.run(cases_csv)
        Path(output_json).parent.mkdir(parents=True, exist_ok=True)
        Path(output_json).write_text(json.dumps(report, indent=2), encoding="utf-8")
        return report
