# Parity Report

## Reference
- Runtime: Design-8a / v5a negation-aware facet promotion
- Model: sentence-transformers/all-MiniLM-L6-v2
- Dimension: 384

## Exact decision parity fields
- Resolution_Type
- Resolution_ID
- Selected_KCR_IDs
- Evidence_Node_IDs
- Scope_Status
- Recommended_SCR_ID
- Promoted_SCR_IDs
- Decision_Status
- Negation_Vetoed_SCR_IDs

## Numeric tolerance fields
- Scope_Mismatch_Sibling_Score
- Direct_Anchor_Score

## Frozen gate summary
| Gate | Reference | Bolt result | Status |
|---|---:|---:|---|
| Regression15 legacy | 15/15 |  |  |
| Educator24 end-to-end | 24/24 |  |  |
| Context quality | 4/4 |  |  |
| ALL59 ready | 46 |  |  |
| Coverage gaps | 13 |  |  |
| Strict E2E | 30/46 |  |  |
| Promoted precision | 69.77% |  |  |
| Promoted recall | 65.22% |  |  |
| Promoted F1 | 67.42% |  |  |
| Forbidden promoted | 0 |  |  |
| Promoted/veto overlap | 0 |  |  |
