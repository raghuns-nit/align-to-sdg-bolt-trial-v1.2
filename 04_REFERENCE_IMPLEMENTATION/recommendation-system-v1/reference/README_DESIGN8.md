# Hybrid KG Runtime v5 — Design-8 Facet-Local Specificity Promotion

Design-8 is a narrow correction to the secondary-SCR path. It preserves the
validated primary ranking, controlled hierarchy, scope/guardrail logic,
abstention behaviour, Application Context evidence and Design-7.5b educator
input flow.

## Why Design-8 exists

The frozen Design-7 MiniLM run removed the mechanical one-label cap, but the
remaining errors separated into three types:

1. promotion-only misses: a required secondary SCR is already highly ranked but
   is not promoted;
2. facet/candidate-recovery misses: a secondary SCR is strong only for a narrow
   mechanism facet and can be diluted in the global profile; and
3. false secondaries: generic lexical overlap can promote a semantically nearby
   SCR whose specific mechanism is absent.

## Design-8 changes

1. Primary Top-1 ranking is unchanged.
2. Strong curated-context promotion remains a valid path.
3. Independent secondaries are discovered locally for each unclaimed mechanism
   facet instead of only from the global Top-N list.
4. Canonical promotion evidence includes SCR name, keywords, mechanism,
   recommendation trigger, core ideas and boundary conditions.
5. Lexical support is specificity-aware: corpus document frequency is used so
   generic overlap is weaker than rare mechanism cues.
6. A secondary must have facet-specific semantic support plus either
   specificity-aware canonical evidence or curated-context support.
7. The primary SCR may claim more than one facet when it already has specific
   evidence and no alternative has a materially stronger facet case. This
   avoids forced multi-label output when one SCR adequately explains several
   clauses.
8. Raw global ranking and promoted/display ranking are both retained for audit.
9. RELATED_TO_SCR is not an eligibility shortcut. Gold labels are never read by
   prediction code.

## Non-goals

Design-8 does not alter the primary ranking weights, semantic model, graph
traversal, educator-input precedence, context normalization, generated-context
compatibility gate, SDG/ESD/CF enrichment, or ontology coverage.

## Benchmark interpretation

Four frozen multi-label rows remain expert-review items rather than safe tuning
targets: TC005, TC007, TC011 and TC028B. Design-8 must not be tuned specifically
to force those labels.