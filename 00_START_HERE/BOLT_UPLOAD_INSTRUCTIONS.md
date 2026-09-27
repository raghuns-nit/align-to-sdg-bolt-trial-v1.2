# Bolt Upload / Execution Instructions

Recommended order:
1. Upload this full package (or unpack it first if Bolt cannot inspect ZIP contents reliably).
2. Paste `BOLT_MASTER_PROMPT_Align_To_SDG_v1.2.md` into Bolt.
3. Add this instruction: **Read all files in `00_START_HERE` first, including `CONTROLLED_EXTENSION_2026-09-27.md`, then current design specifications, runtime repositories, reference implementation, validation evidence, and finally historical rationale. Do not code until you have summarized the authority hierarchy and identified any blocked source artifacts.**
4. Ask Bolt to build the complete V1 in one coordinated attempt and run all 12 quality gates.
5. Require a final `TECHNOLOGY_DECISION_LOG.md`, `QUALITY_GATE_REPORT.md`, `PARITY_REPORT.md`, and `BLOCKED_ITEMS.md`.

If Bolt proposes different technologies, accept the experiment only when it records the reason, behavioral risk, and corresponding validation evidence.


After implementation, require Bolt to provide a live reviewable preview/published URL where supported and an `APPLICATION_REVIEW_CHECKLIST.md`.
