# Authoritative Baseline

## Product identity
**Align To SDG**  
**An Ontology - Knowledge Graph Driven Recommendation System for Integrating Sustainability Concepts in Higher Education Curricula**

## Frozen recommendation baseline
The accepted behavioral reference is Design-8a (`v5a-design8a-negation-aware-facet-promotion`) using the reference embedding model `sentence-transformers/all-MiniLM-L6-v2`, 384 dimensions.

Key preserved rules:
- Course → Module → Subtopic is the normal V1 recommendation entry path.
- Subtopic is the authoritative curriculum anchor.
- Controlled hierarchical graph expansion; no unrestricted graph wandering.
- Educator-entered Application Context supersedes accepted system-generated context.
- Application Context compatibility/eligibility precedes semantic ranking.
- Teaching Context affects pedagogy/Kit only, not SCR eligibility.
- `RELATED_TO_SCR` is not eligibility evidence.
- Gold labels are evaluation-only and never prediction input.
- Positive facets support discovery; explicit negation/exclusion performs conflict/veto only.
- Primary Top-1 behavior remains unchanged by secondary-promotion logic.
- Failed Kit validation is recorded; no automatic repair/regeneration loop.
- V1 Kit export is PDF only.
- V1 Administration is protected and read-only/static/prototype; no canonical repository mutation/publication in the product UI.
- Knowledge Graph Explorer is read-only and independent from recommendation traversal authority.

## Fresh reproduced Design-8a gate
The fresh Colab rerun supplied in `06_VALIDATION_EVIDENCE` reproduced the accepted Design-8a baseline:
- Regression15: 15/15 legacy pass
- Educator input: 24/24 end-to-end
- Context quality: 4/4
- ALL59: 46 recommendation-ready / 13 coverage gaps
- Strict end-to-end: 30/46
- Promoted precision: 69.77%
- Promoted recall: 65.22%
- Promoted F1: 67.42%
- Forbidden promoted violations: 0
- Unsupported inference: 0
- Negation promoted/veto overlap: 0
- Counterfactual direction: 5/5

These metrics are gates/reference evidence, not tuning targets.
