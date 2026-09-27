# Design-8a — Negation-aware secondary-SCR promotion

## Scope
Design-8a is a safety correction to Design-8 v1. It does not change the validated primary Top-1 ranking path, controlled traversal, educator input routing/normalization, generated-context eligibility, MiniLM model, or positive facet-local secondary search.

## Design invariant
**Explicitly negated or excluded mechanism facets are exclusion evidence only.**

1. Negated facets MUST NOT generate or strengthen positive secondary promotion.
2. If a secondary candidate specifically matches a negated facet, the candidate is vetoed from promotion even if semantic/context similarity is high.
3. A candidate whose strongest secondary-promotion evidence comes from a negated facet cannot be promoted.
4. Curated-context similarity cannot override an explicit negation.
5. Design-8a applies the veto to the secondary-promotion path only so the validated primary Top-1 path remains unchanged.

## Why this was required
Design-8 v1 promoted SCR_0077 Polluter Pays Responsibility in XD014 and educator case EI011 from the explicit statement that **no polluter-liability rule is invoked**. The same words that excluded the rule were being used as semantic/lexical evidence for it.

## Polarity handling
Mechanism text is split into promotion facets. Facets with clear exclusion constructions such as clause-initial `no`, `without`, `never`, or rule-not-invoked/not-applied formulations are separated into negative facets. Outcome descriptions such as `did not change the final approval conditions` and counterfactual phrases such as `would otherwise be excluded` are deliberately not treated as whole-facet negation.

Positive facets feed candidate discovery and promotion. Negative facets are scored only for conflict. A veto requires both semantic match and specific canonical lexical/IDF evidence to avoid broad false exclusions.

## Audit fields
- `Promotion_Facets_JSON` — positive promotion facets only.
- `Negative_Promotion_Facets_JSON` — explicit exclusion facets.
- `Negation_Vetoed_SCR_IDs` — candidates blocked by the polarity rule.
- Top-candidate trace includes `Negation_Veto`, facet index/text and veto reason.

## Acceptance gates
- 15-case legacy regression remains 15/15.
- Design-7.5b educator-input suite returns to 24/24 end-to-end.
- Generated-context quality remains 4/4.
- Frozen59 forbidden promoted violations = 0.
- Unsupported inference = 0.
- Counterfactual direction = 5/5.
- Primary Top-1 remains unchanged.
- Preserve useful Design-8 facet-local rescues such as TC004 → SCR_0004 and XD021 → SCR_0083 where MiniLM confirms them.

## Design-document note
Record this as another architecture invariant: semantic similarity is evidence, not authority; **polarity and governed constraints determine whether semantic evidence may support or veto a recommendation.**
