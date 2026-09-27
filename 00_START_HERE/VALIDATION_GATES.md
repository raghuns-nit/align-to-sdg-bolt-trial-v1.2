# Mandatory Quality Gates for the Bolt Trial — v1.2

Bolt must report PASS / FAIL / BLOCKED / NOT_APPLICABLE with evidence for each gate.

1. **QG-01 Repository integrity** — governed IDs, required files/headers, referential integrity, hierarchy typing, no silent repair; runtime database import is lossless and versioned.
2. **QG-02 Contract integrity** — runtime requests/responses conform to approved interface contracts and controlled enums.
3. **QG-03 Graph integrity** — directed multi-edge semantics, deterministic traversal/path behavior, no unrestricted graph wandering.
4. **QG-04 Semantic-engine integrity** — exact reference MiniLM model/dimension or explicit experimental substitution; no hidden fallback.
5. **QG-05 Recommendation parity** — compare Bolt engine decisions against frozen Design-8a reference outputs.
6. **QG-06 Educator-input regression** — 24/24 frozen educator-input end-to-end control.
7. **QG-07 Polarity/safety** — zero forbidden promotions; zero promoted/veto overlap; explicit negation remains veto-only.
8. **QG-08 UI contract fidelity** — each functional control/result binds to an approved field/runtime object; internal IDs hidden in normal educator flow; Help_Key behavior preserved.
9. **QG-09 Educator Kit contract fidelity** — required/conditional output elements, validation states, immutable snapshot view/export, no placeholder satisfaction.
10. **QG-10 Application quality** — build succeeds, automated unit/integration/contract/UI tests run, primary user journeys complete, critical runtime errors absent.
11. **QG-11 Authentication, user ownership, history, and saved-state integrity** — EDUCATOR/ADMIN roles enforced; private history isolated; persisted recommendations associated with correct user; Save for Later persists EducatorDecision; user management is Admin-only and does not mutate canonical repositories.
12. **QG-12 Help and published review readiness** — contextual help and Help Center work; Help cannot influence Recommendation Core; application is previewable/published where supported; version/build identity, setup instructions and review checklist are present; no deployment secrets exposed.

### Reference metrics
- Regression15: 15/15 legacy pass
- Educator24: 24/24 end-to-end
- Context quality: 4/4
- ALL59: 46 ready, 13 coverage gaps
- Strict E2E: 30/46
- Promoted P/R/F1: 69.77% / 65.22% / 67.42%
- Forbidden promoted: 0
- Negation promoted/veto overlap: 0

Do not aggregate historical suites into one score. Coverage and recommendation quality remain separate.
