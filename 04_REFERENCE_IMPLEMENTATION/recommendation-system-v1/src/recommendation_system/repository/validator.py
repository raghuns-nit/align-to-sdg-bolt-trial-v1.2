from __future__ import annotations
import csv
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

REQUIRED_FILES = {
    "01_course.csv": ["course_id:ID", "title", "status", ":LABEL"],
    "02_module.csv": ["module_id:ID", "name", "status", ":LABEL"],
    "03_subtopic.csv": ["subtopic_id:ID", "name", "status", ":LABEL"],
    "04_kcr.csv": ["kcr_id:ID", "name", "definition", "status", ":LABEL"],
    "05_kpr.csv": ["kpr_id:ID", "name", "definition", "status", ":LABEL"],
    "06_kfr.csv": ["kfr_id:ID", "name", "definition", "status", ":LABEL"],
    "07_scr.csv": ["scr_id:ID", "name", "definition", "status", ":LABEL"],
    "08_guardrail.csv": ["guardrail_id:ID", "guardrail_level", "status", ":LABEL"],
    "09_application_context.csv": ["application_context_id:ID", "name", "mechanism", "status", ":LABEL"],
    "10_sdg_goal.csv": ["sdg_goal_id:ID", "goal_number", "status", ":LABEL"],
    "11_sdg_target.csv": ["sdg_target_id:ID", "target_code", "status", ":LABEL"],
    "12_sdg_indicator.csv": ["sdg_indicator_id:ID", "indicator_code", "status", ":LABEL"],
    "13_esd_objective.csv": ["esd_objective_id:ID", "text", "status", ":LABEL"],
    "14_esd_competency.csv": ["esd_competency_id:ID", "name", "status", ":LABEL"],
    "15_cf_knowledge.csv": ["cf_knowledge_id:ID", "text", "status", ":LABEL"],
    "16_cf_skill.csv": ["cf_skill_id:ID", "text", "status", ":LABEL"],
    "17_cf_value.csv": ["cf_value_id:ID", "text", "status", ":LABEL"],
    "18_cf_competency.csv": ["cf_competency_id:ID", "name", "status", ":LABEL"],
    "relationships.csv": [":START_ID", ":END_ID", ":TYPE"],
}

ID_FIELD_BY_FILE = {
    name: cols[0] for name, cols in REQUIRED_FILES.items() if name != "relationships.csv"
}

ALLOWED_RELATIONSHIPS = {
    "OUTCOME_FOR_SDG", "CONTAINS_SUBTOPIC", "GOVERNS_SUBTOPIC", "MAPS_TO_KCR",
    "SUPPORTS_SDG_TARGET", "CONTAINS_MODULE", "GOVERNS_MODULE", "OBJECTIVE_FOR_SDG",
    "ACTS_ON_KCR", "APPLIES_TO_KCR", "MEASURES_TARGET", "RELATED_TO_SCR",
    "REFERENCES_SDG_INDICATOR", "REQUIRES_KNOWLEDGE_OF", "BELONGS_TO_SDG",
    "OPERATIONALIZES", "RELATED_TO_KPR", "GOVERNS_COURSE", "EVIDENCE_SUPPORTS",
    "REQUIRES_PRINCIPLE", "IS_SUBCONCEPT_OF_KCR", "MERGED_INTO",
}

@dataclass
class ValidationIssue:
    severity: str
    code: str
    message: str
    file: str = ""
    row: int | None = None

@dataclass
class ValidationReport:
    issues: list[ValidationIssue] = field(default_factory=list)
    files_checked: int = 0
    node_count: int = 0
    relationship_count: int = 0

    @property
    def errors(self) -> list[ValidationIssue]:
        return [x for x in self.issues if x.severity == "ERROR"]

    @property
    def warnings(self) -> list[ValidationIssue]:
        return [x for x in self.issues if x.severity == "WARNING"]

    @property
    def passed(self) -> bool:
        return not self.errors

class RepositoryValidator:
    def __init__(self, repository_dir: str | Path):
        self.root = Path(repository_dir)

    @staticmethod
    def _read(path: Path) -> tuple[list[str], list[dict[str, str]]]:
        with path.open(encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            return list(reader.fieldnames or []), list(reader)

    def validate(self) -> ValidationReport:
        report = ValidationReport()
        all_ids: dict[str, str] = {}
        rows_by_file: dict[str, list[dict[str, str]]] = {}

        for filename, required in REQUIRED_FILES.items():
            path = self.root / filename
            if not path.exists():
                report.issues.append(ValidationIssue("ERROR", "MISSING_FILE", f"Required file missing: {filename}", filename))
                continue
            report.files_checked += 1
            headers, rows = self._read(path)
            rows_by_file[filename] = rows
            missing = [c for c in required if c not in headers]
            if missing:
                report.issues.append(ValidationIssue("ERROR", "MISSING_COLUMN", f"Missing columns: {', '.join(missing)}", filename))
            if filename == "relationships.csv":
                continue
            id_field = ID_FIELD_BY_FILE[filename]
            seen: set[str] = set()
            for idx, row in enumerate(rows, start=2):
                ident = (row.get(id_field) or "").strip()
                if not ident:
                    report.issues.append(ValidationIssue("ERROR", "BLANK_ID", f"Blank {id_field}", filename, idx))
                    continue
                if ident in seen:
                    report.issues.append(ValidationIssue("ERROR", "DUPLICATE_ID", f"Duplicate ID {ident}", filename, idx))
                seen.add(ident)
                if ident in all_ids:
                    report.issues.append(ValidationIssue("ERROR", "GLOBAL_DUPLICATE_ID", f"ID {ident} also occurs in {all_ids[ident]}", filename, idx))
                all_ids[ident] = filename
                if not re.match(r"^[A-Za-z][A-Za-z0-9_\-.]*$", ident):
                    report.issues.append(ValidationIssue("WARNING", "ID_FORMAT", f"Non-standard ID format: {ident}", filename, idx))
            report.node_count += len(rows)

        rel_rows = rows_by_file.get("relationships.csv", [])
        report.relationship_count = len(rel_rows)
        seen_edges: set[tuple[str, str, str]] = set()
        for idx, row in enumerate(rel_rows, start=2):
            s, t, tp = (row.get(":START_ID") or "").strip(), (row.get(":END_ID") or "").strip(), (row.get(":TYPE") or "").strip()
            if s not in all_ids:
                report.issues.append(ValidationIssue("ERROR", "UNKNOWN_START_ID", f"Relationship start ID not found: {s}", "relationships.csv", idx))
            if t not in all_ids:
                report.issues.append(ValidationIssue("ERROR", "UNKNOWN_END_ID", f"Relationship end ID not found: {t}", "relationships.csv", idx))
            if tp not in ALLOWED_RELATIONSHIPS:
                report.issues.append(ValidationIssue("ERROR", "UNKNOWN_RELATIONSHIP_TYPE", f"Unexpected relationship type: {tp}", "relationships.csv", idx))
            key = (s, t, tp)
            if key in seen_edges:
                report.issues.append(ValidationIssue("WARNING", "DUPLICATE_EDGE", f"Duplicate relationship {key}", "relationships.csv", idx))
            seen_edges.add(key)

        # Hierarchy sanity: containment relationships must point to expected prefixes.
        for idx, row in enumerate(rel_rows, start=2):
            s, t, tp = row[":START_ID"], row[":END_ID"], row[":TYPE"]
            if tp == "CONTAINS_MODULE" and not (s.startswith("COURSE_") and (t.startswith("MODULE_") or t.startswith("MOD_"))):
                report.issues.append(ValidationIssue("ERROR", "HIERARCHY_TYPE", f"Invalid CONTAINS_MODULE endpoints: {s}->{t}", "relationships.csv", idx))
            if tp == "CONTAINS_SUBTOPIC" and not ((s.startswith("MODULE_") or s.startswith("MOD_")) and (t.startswith("SUBTOPIC_") or t.startswith("SUB_"))):
                report.issues.append(ValidationIssue("ERROR", "HIERARCHY_TYPE", f"Invalid CONTAINS_SUBTOPIC endpoints: {s}->{t}", "relationships.csv", idx))
            if tp == "MAPS_TO_KCR" and not ((s.startswith("SUBTOPIC_") or s.startswith("SUB_")) and t.startswith("KCR_")):
                report.issues.append(ValidationIssue("ERROR", "HIERARCHY_TYPE", f"Invalid MAPS_TO_KCR endpoints: {s}->{t}", "relationships.csv", idx))

        return report
