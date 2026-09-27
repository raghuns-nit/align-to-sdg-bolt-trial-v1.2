from __future__ import annotations
import csv
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .validator import ID_FIELD_BY_FILE, RepositoryValidator

TEXT_FIELDS = {
    "01_course.csv": ["title", "description", "objectives", "learning_outcomes"],
    "02_module.csv": ["name", "description"],
    "03_subtopic.csv": ["name", "description"],
    "04_kcr.csv": ["name", "definition", "scope", "core_principles", "semantic_description", "keywords_synonyms"],
    "05_kpr.csv": ["name", "definition", "scope", "core_ideas", "semantic_description", "keywords_synonyms"],
    "06_kfr.csv": ["name", "definition", "scope", "purpose", "inputs", "outputs", "realization_or_mechanism", "semantic_description", "keywords_synonyms"],
    "07_scr.csv": ["name", "definition", "scope", "core_ideas", "semantic_description", "keywords_synonyms", "sustainability_principle", "underlying_mechanism", "boundary_conditions", "recommendation_trigger"],
    "09_application_context.csv": ["name", "description", "technical_problem", "operational_action", "mechanism", "sustainability_outcome", "boundary_conditions", "keywords_synonyms"],
}

class RepositoryCompiler:
    def __init__(self, repository_dir: str | Path, output_dir: str | Path):
        self.root = Path(repository_dir)
        self.out = Path(output_dir)

    @staticmethod
    def _sha256(path: Path) -> str:
        h = hashlib.sha256()
        with path.open("rb") as f:
            for block in iter(lambda: f.read(1024 * 1024), b""):
                h.update(block)
        return h.hexdigest()

    @staticmethod
    def _rows(path: Path) -> list[dict[str, str]]:
        with path.open(encoding="utf-8-sig", newline="") as f:
            return list(csv.DictReader(f))

    def compile(self) -> dict[str, Any]:
        report = RepositoryValidator(self.root).validate()
        if not report.passed:
            raise ValueError(f"Repository validation failed with {len(report.errors)} error(s)")
        self.out.mkdir(parents=True, exist_ok=True)

        nodes: list[dict[str, Any]] = []
        corpus: dict[str, str] = {}
        source_files: dict[str, Any] = {}
        for path in sorted(self.root.glob("*.csv")):
            source_files[path.name] = {"sha256": self._sha256(path), "bytes": path.stat().st_size}
            if path.name == "relationships.csv":
                continue
            rows = self._rows(path)
            id_field = ID_FIELD_BY_FILE.get(path.name)
            for row in rows:
                ident = row.get(id_field or "", "")
                if not ident:
                    continue
                node = {"id": ident, "source_file": path.name, "label": row.get(":LABEL", ""), "properties": row}
                nodes.append(node)
                fields = TEXT_FIELDS.get(path.name)
                if fields:
                    corpus[ident] = " ".join(str(row.get(f, "") or "").strip() for f in fields if str(row.get(f, "") or "").strip())

        edges = []
        for row in self._rows(self.root / "relationships.csv"):
            edges.append({"source": row[":START_ID"], "target": row[":END_ID"], "type": row[":TYPE"]})

        graph = {"nodes": nodes, "edges": edges}
        (self.out / "compiled_graph.json").write_text(json.dumps(graph, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        (self.out / "semantic_corpus.json").write_text(json.dumps(corpus, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        manifest = {
            "schema_version": "1.0",
            "compiled_at_utc": datetime.now(timezone.utc).isoformat(),
            "source_files": source_files,
            "node_count": len(nodes),
            "edge_count": len(edges),
            "semantic_corpus_count": len(corpus),
            "graph_sha256": self._sha256(self.out / "compiled_graph.json"),
            "semantic_corpus_sha256": self._sha256(self.out / "semantic_corpus.json"),
            "validation": {"passed": True, "warnings": len(report.warnings)},
        }
        (self.out / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        return manifest

    def compile_embeddings(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2") -> dict[str, Any]:
        """Optional deployment step; intentionally explicit so model substitution cannot be silent."""
        import numpy as np
        from sentence_transformers import SentenceTransformer
        corpus = json.loads((self.out / "semantic_corpus.json").read_text(encoding="utf-8"))
        ids = list(corpus)
        model = SentenceTransformer(model_name)
        emb = model.encode([corpus[i] for i in ids], normalize_embeddings=True, show_progress_bar=False)
        np.save(self.out / "embeddings.npy", emb)
        (self.out / "embedding_ids.json").write_text(json.dumps(ids), encoding="utf-8")
        meta = {"model_name": model_name, "dimension": int(emb.shape[1]), "count": len(ids)}
        (self.out / "embedding_manifest.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
        return meta
