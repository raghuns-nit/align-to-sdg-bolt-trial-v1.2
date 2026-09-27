from __future__ import annotations
from pathlib import Path
from typing import Any

from .design8a_runtime import HybridRuntime, RuntimeConfig
from recommendation_system.contracts import RecommendationCase

class RecommendationCoreService:
    """Production-facing adapter around the frozen Design-8a kernel.

    SEQ-15 intentionally preserves the accepted v5a algorithm verbatim inside
    ``design8a_runtime.py``. Refactoring below this boundary is permitted only
    when the SEQ-13 parity harness remains green.
    """

    def __init__(self, repository_dir: str | Path, *, backend: str = "auto",
                 model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        cfg = RuntimeConfig(semantic_backend=backend, model_name=model_name)
        self._runtime = HybridRuntime(str(repository_dir), cfg)

    @property
    def runtime_version(self) -> str:
        return "v5a-design8a-negation-aware-facet-promotion"

    @property
    def semantic_backend(self) -> str:
        return self._runtime.backend.name

    def recommend(self, case: RecommendationCase | dict[str, Any]) -> dict[str, Any]:
        payload = case.model_dump() if isinstance(case, RecommendationCase) else dict(case)
        return self._runtime.predict(payload)
