# Do Not Change — Semantic and Scope Rules

Bolt may change implementation technology, libraries, runtime, database, UI framework, graph library, model execution runtime, build system and test framework. It may not silently change the following.

## Recommendation semantics
- Design-8a primary Top-1 behavior
- eligibility-before-ranking
- controlled hierarchical traversal and scope fallback
- Subtopic-first evidence priority
- scope mismatch / re-anchor rules
- guardrail and boundary-condition semantics
- abstention semantics
- facet-local secondary discovery
- specificity-aware promotion evidence
- explicit-negation / exclusion veto behavior

## Model semantics
Reference model: `sentence-transformers/all-MiniLM-L6-v2`, dimension 384. A different execution runtime is allowed. A different model must be explicitly labelled `EXPERIMENTAL_MODEL_SUBSTITUTION` and cannot claim parity until the frozen suite passes.

## Ontology and repository authority
Do not invent canonical KCR/KPR/KFR/SCR relationships, ontology nodes, repository rows, IDs, or missing mappings. Do not repair coverage gaps through ranking/model tuning. Semantic similarity does not create ontology truth.

## Evidence rules
- Do not use `RELATED_TO_SCR` as eligibility evidence.
- Do not expose benchmark gold during prediction.
- Do not add case-specific boosts.
- Do not tune thresholds merely to force frozen labels.
- Do not use generated explanation text as evidence.

## Input semantics
- Preserve Course → Module → Subtopic.
- Preserve `EDUCATOR_ENTERED | ACCEPTED_SYSTEM_GENERATED`.
- Preserve educator-entered Application Context precedence.
- Teaching Context cannot affect SCR eligibility/ranking.

## Kit semantics
- Preserve Stage-E Template selection semantics.
- Preserve PKCR / output-element contract semantics.
- Required output elements cannot be satisfied by generic placeholders.
- Do not auto-repair/regenerate a failed Kit.
- Do not display `VALIDATION_FAILED` as `READY`.
- Rendering/view/export must use the persisted immutable Kit snapshot, not recompute it.

## V1 scope
Do not silently add functional canonical repository authoring, repository mutation/publication, benchmark-driven auto-tuning, HTML/Excel Kit export, or unapproved public recommendation routes.


## 2026-09-27 operational/UI extension boundaries
Authentication, basic User Management, My History, Save for Later, Application Help, and runtime repository database import are approved for the Bolt trial.

They must not:
- turn runtime database mirrors into editable canonical authority;
- let Help content become recommendation evidence;
- recompute persisted history/Kit content merely for viewing;
- expose one educator's private history to another;
- store plaintext passwords/auth secrets;
- grant repository mutation rights through User Management;
- change Design-8a, Application Context precedence, Teaching Context boundaries, or Stage-F semantics.
