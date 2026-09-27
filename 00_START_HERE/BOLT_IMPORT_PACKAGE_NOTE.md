# Bolt Import Package Note — v1.2 Reduced Operational Copy

This repository/package is a size-reduced Bolt-import copy derived from the complete authoritative `Align_To_SDG_Bolt_Trial_Package_v1.2`.

The following generated/duplicate files are intentionally omitted only to satisfy Bolt's new-project repository-size limit:

1. `04_REFERENCE_IMPLEMENTATION/recommendation-system-v1/artifacts/compiled/compiled_graph.json`
2. `04_REFERENCE_IMPLEMENTATION/recommendation-system-v1/artifacts/compiled/semantic_corpus.json`
3. The duplicate runtime-repository CSV copy formerly under `04_REFERENCE_IMPLEMENTATION/recommendation-system-v1/data/repository/`

The two JSON files are derived compiled artifacts, not canonical source authority. Where equivalent compiled structures are required, generate them from the supplied runtime repository using the defined validation/compiler semantics.

Before omission, every CSV in the removed duplicate repository directory was SHA-256 verified against the corresponding file in `05_RUNTIME_REPOSITORIES/`; all 19 CSV files matched exactly.

For this Bolt implementation copy, the unchanged authoritative runtime repository files are available once under:

`05_RUNTIME_REPOSITORIES/`

These omissions do **not** change the architecture, contracts, IDs, relationships, recommendation semantics, Design-8a behavior, provenance requirements, Stage-F requirements, validation expectations, or the 12 quality gates.

The complete original `Align_To_SDG_Bolt_Trial_Package_v1.2` remains the archival source package.

**Governing principle: Technology freedom; semantic immutability.**
