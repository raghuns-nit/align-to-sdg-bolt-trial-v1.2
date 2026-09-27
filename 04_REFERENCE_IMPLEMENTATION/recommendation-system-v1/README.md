# Sustainability Recommendation System — V1 Implementation Baseline

This repository bootstraps the original Python implementation plan for the ontology and knowledge-graph driven sustainability recommendation system.

## Frozen implementation rule

Design-8a / v5a is the accepted recommendation-runtime baseline. The file `reference/hybrid_runtime_v5.py` is treated as a reference oracle. `src/recommendation_system/core/design8a_runtime.py` is the migrated kernel for SEQ-15. Any later refactor must pass the SEQ-13 parity harness before merge.

## Quick start

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
python scripts/create_smoke_cases.py
python scripts/validate_repository.py data/repository
python scripts/compile_repository.py data/repository artifacts/compiled
python scripts/run_parity.py --reference reference/hybrid_runtime_v5.py --repo data/repository --cases data/benchmark/smoke_cases.csv --output artifacts/parity_reports/smoke_lsa.json --backend lsa
pytest
```

For the accepted semantic baseline install `.[semantic,dev]` and run parity with `--backend sentence-transformer` using the frozen benchmark cases/reference outputs.

## Important scope

- Canonical repositories remain governed source data; generated runtime output never writes back to them.
- V1 product input requires Course → Module → Subtopic; text-only anchor resolution is not productized.
- Recommendation and Kit domain outcomes remain distinct from technical errors.
- Repository publication/build/rollback from the Admin UI is deferred; this build pipeline is development/deployment tooling.
