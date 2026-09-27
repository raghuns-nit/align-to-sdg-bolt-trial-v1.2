# Project - Design 7: Recommendation System Handoff Context v1

## Purpose
This file is the continuity record for the Recommendation System project. It consolidates the decisions, frozen baselines, repository rules, validation evidence, Stage-D framework-mapping rules, and next actions needed to continue in a new chat without reconstructing prior discussions.

## 1. Research scope and V1 positioning
- Research demonstrator for an ontology-driven Knowledge Graph recommendation system that helps educators integrate sustainability concepts into higher-education curricula.
- V1 is a **Research Demonstrator**, not a production/commercial platform.
- Educator judgement remains authoritative.
- Operational V1 baseline: **Design-8a + Repository v1.1**.
- Repository v1.2–v1.2.3 and Design-9 are retained as research/future evidence, not V1 runtime.
- System flow: Course → Module → Subtopic → KCR/KPR/KFR → KG → SCR recommendation → SDG/UNESCO ESD/Commonwealth enrichment → Educator Guide/Kit.

## 2. Controlled semantic retrieval / recommendation architecture
- Use controlled hierarchical graph expansion, never unrestricted graph wandering.
- Start at selected Subtopic where available → related KCR/KPR/KFR → Module → Course only when narrower evidence is insufficient.
- Valid subtopic-level recommendation normally outranks equally strong broader module/course inference.
- Related_Concepts = discovery.
- Prerequisite_Concepts = readiness.
- Missing prerequisite is a preparation flag, not an automatic recommendation rejection.
- Guardrails constrain technical scope but are **not hard sustainability filters**; socio-technical links are allowed when supported.
- Semantic similarity ranks eligible candidates; it does not create eligibility or ontology truth.

## 3. Runtime / persistence decisions
- `TopicSemanticProfile` = transient ontology-aware runtime projection, not a persistent Neo4j node.
- `ApplicationMechanismProfile` = transient runtime object, not persistent ontology truth.
- Persist an operational/provenance entity such as `RecommendationEvent` / `RecommendationContextSnapshot` containing anchor/scope, evidence/path considered, selected/generated Application Context, SCR output, scores, versions, and educator feedback.
- Educator-entered Application Context supersedes system-generated context on the main path; system may show 1–2 generated alternatives. Preserve source/provenance separately.

## 4. Application Context Semantic Separation
Maintain distinct evidence roles:
- PositiveSemanticProfile = positive in-scope mechanism evidence used for embedding/ranking.
- EligibilityProfile = typed necessary conditions for mechanism-specific eligibility/promotion.
- ExclusionProfile = explicit veto/negative/neighboring mechanism evidence; blocks/weakens, never positively promotes.
- GovernanceProfile = human-readable boundaries, transferability, provenance, cautions; not automatically positive embedding evidence.
- Eligibility profiles are evidence-path scoped; multiple profiles may exist with typed AND/OR/veto logic.
- Explicit_Negation is exclusion/veto evidence only. Negated facets may weaken/block an SCR but never discover/strengthen/promote it.
- Explicit exclusion overrides similarity.

## 5. Input contract
A. Subtopic only → system generates 1–2 Application Contexts; no authoritative final SCR until educator accepts one.
B. Anchor + educator text → anchor remains technical authority; educator context/question is primary application evidence; mismatch triggers re-anchor/block.
C. Educator text only → resolve safe anchor first; ambiguity blocks; no direct text→SCR.
- Context phrase and question are separate evidence surfaces.

## 6. Frozen V1 runtime / validation state
### Repository / runtime
- Frozen V1 repository: `Workbook1_Lean_Semantic_Enhanced_v1.1(1).xlsx`.
- V1 graph: `Neo4j_Lean_CSV_Bundle_v1.1.zip`.
- Runtime: `Hybrid_KG_Runtime_v5a_Design8a_NegationAwareFacetPromotion.zip`.
- Model used in validation: `sentence-transformers/all-MiniLM-L6-v2`, 384 dimensions.
- V1 graph: 9,033 nodes / 10,347 relationships / 22 relationship types; 40 Application Context nodes; 96 SCR rows / 95 active.

### Validation snapshots — keep denominators separate
- 15-case: Design-8a legacy 15/15; Top1 13/15; Top3 15/15; strict E2E 14/15.
- Blind8: 6/8 exact; P=.857, R=.750, F1=.800; unsupported 0/3.
- 35 benchmark: 22 ready / 13 gaps; Top1 20/22; Top3 19/22; P=.8333, R=.4762, F1=.6061; no-SCR FP=0; unsupported=0.
- 59 expanded, 46 ready / 13 gaps. Design-8a accepted v1.1: Top1 38/46=82.6%; Top3 38/46; strict 30/46=65.2%; P=.698, R=.652, F1=.674; complete multi 4/15; forbidden=0; unsupported=0; CF=5/5.
- Educator D7.5b frozen: routing/E2E 24/24; Top1/Top3/promotion 15/15 recommendation; negatives 9/9; generated context 4/4; semantic-family equivalence 6/6.

## 7. V1 / Design-9 boundary
- Design-8a is the accepted runtime.
- Design-9 typed eligibility / positive / exclusion / governance architecture is future/research evidence only.
- Do not continue production-style 9B→9C unless explicitly reopened.
- Maintenance hierarchy: schema/integrity → local contrastive tests → typed eligibility/exclusion tests → affected subsystem regression → impact/sensitivity audit → full release benchmark when promoting executable release → provenance/version/rollback.

## 8. Lean repository rule
Canonical repositories store only stable reusable entities and explicit relationships.
Generated content, runtime scores, recommendations, educator-specific outputs, transient semantic objects, review status, rationale and audit metadata stay outside canonical repositories.

## 9. Stage D — Framework Mapping architecture
SCR is the downstream pivot.
- Framework enrichment occurs **after SCR recommendation eligibility** and cannot create SCR eligibility.
- Do not create SCR×Course canonical mappings.
- Application Context is runtime adaptation evidence, not a canonical framework-map key.
- Runtime concept: SCR framework mappings + SCR pedagogical templates + Course/Subtopic + Application Context + educator constraints → contextualized Educator Kit.

### Authoritative framework repositories
1. `UN_SDG_Lean_v1.xlsx`
   - canonical IDs such as `SDG_GOAL_01`, `SDG_TARGET_1_1`, `SDG_INDICATOR_1_1_1`.
   - Goal → Target → Indicator hierarchy.
2. `UNESCO_ESD_Lean_v1.xlsx`
   - 255 Learning Objectives + 8 ESD Competencies.
   - Objective→SDG Goal is canonical.
   - No fixed Objective↔Competency mapping is asserted by source.
3. `Curriculum_Framework_Lean_v1.xlsx`
   - canonical IDs: `CFK_*`, `CFS_*`, `CFV_*`, `CF_COMP_*`.
   - V1 education pool = **Tertiary education + TVET + Adult education**.
   - Tertiary is the default for formal higher education; TVET is eligible when applied technical/workplace fit is stronger; Adult education is eligible where community/action orientation is stronger.
   - No outcome→competency or competency→SDGGoal source edge is asserted.

### Traceability hard rule
Every mapping must point to the exact canonical `Framework_Element_ID`; never store free-text framework labels as the relationship target.
`Framework_Element_ID` must resolve exactly in the stated authoritative repository before acceptance.
Do not invent an ID string merely because it follows the naming pattern.

### Canonical mapping workbook shape
Only one canonical sheet: `SCR_Framework_Mapping`.
Columns:
1. `SCR_ID`
2. `Framework_Element_ID`
3. `Relationship_Type`
4. `Mapping_Role` (`CORE` / `CONDITIONAL`)
5. `Education_Level`
6. `Applicability_Condition`

Relationship types:
- `ALIGNS_WITH_SDG_GOAL`
- `ALIGNS_WITH_SDG_TARGET`
- `RELATED_TO_SDG_INDICATOR`
- `ALIGNS_WITH_ESD_OBJECTIVE`
- `DEVELOPS_ESD_COMPETENCY`
- `ALIGNS_WITH_CF_KNOWLEDGE`
- `DEVELOPS_CF_SKILL`
- `CULTIVATES_CF_VALUE`
- `DEVELOPS_CF_COMPETENCY`

### Framework mapping selection logic
- Existing validated SCR→SDG mappings are retained and not rebuilt.
- For ESD/CF candidate search, an SCR's validated SDG Goal(s) narrow the candidate pool.
- Same-goal membership alone never creates a mapping.
- Review each candidate against SCR Definition + Scope + Core Ideas + Underlying Mechanism + Boundary Conditions + latest Application Contexts.
- Keep **all substantively relevant** outcomes; there is no one-Knowledge/one-Skill/one-Value cap.
- `CORE` = direct principle/mechanism fit.
- `CONDITIONAL` = useful only in a narrower application/education context; retain concise applicability condition.
- Do not force fake non-empty mappings. Justified abstention is allowed.
- UNESCO ESD competencies are mapped independently from objectives.
- Commonwealth competency clusters are mapped independently from outcomes.

### Latest complete mapping draft
Generated files:
- `SCR_Framework_Mapping_Lean_v0.5_Complete_Draft.xlsx`
- `SCR_Framework_Mapping_Review_v0.5_Complete_Draft.xlsx`
Current draft counts:
- 95 active SCRs.
- 674 reviewed SDG mappings carried forward.
- 117 ESD Learning Objective mappings.
- 177 ESD Competency mappings.
- 229 Commonwealth Knowledge mappings.
- 245 Commonwealth Skill mappings.
- 169 Commonwealth Value mappings.
- 143 Commonwealth Competency mappings.
- Total canonical mapping rows = 1,754.
- CORE = 1,059; CONDITIONAL = 695.
- Justified abstention in draft: 4 SCRs without ESD Objective, 6 without CF Knowledge, 10 without CF Skill, 22 without CF Value.

### Commonwealth source visibility issue to resolve before final freeze
- `Curriculum_Framework_Lean_v1` README declares 1,089 Knowledge + 1,026 Skill + 986 Value outcomes.
- Current text/index retrieval exposed only 1,000 Knowledge + 1,000 Skill + 986 Value rows.
- No unseen CF IDs were invented in v0.5.
- Therefore SDG16/17 Commonwealth Knowledge/Skill coverage can be under-represented until the inaccessible tail of the repository can be read/validated directly.
- Treat this as a source-access / repository-QA issue, not a reason to fabricate IDs.

## 10. External SDG Actions Platform rule
External cases are pedagogical transfer cases, not mapping authority.
Store only source-declared information:
`Case_ID, Source, Source_Record_ID, Title, Source_URL, Declared_SDGs, Declared_Targets(if explicit), Declared_Indicators(if explicit), Short_Description, Retrieved_Date, Status`.
If the source gives only Goal, show only Goal. Do not infer target/indicator and write it back to the case.

## 11. Stage E — SCR Pedagogical Repository (next after D freeze)
Use term **SCR Pedagogical Template** contained in **SCR Pedagogical Repository**.
Canonical: `SCR → HAS_PEDAGOGICAL_TEMPLATE → Template`.
Reusable, course-independent patterns later adapted to Course/Application Context.

### Frozen pedagogical taxonomy
Teaching Activities:
- Activity
- Workshop
- Discussion
- Debate
- CaseStudy
- RolePlay
- FieldVisit
- GuestLecture

Assessment & Evaluation — only:
- Assignment
- Quiz
- Project
- Portfolio

Resources & Materials — only:
- Resource
- Reading
- Media
- Dataset

Rubrics may be generated inside Assignment/Project/Portfolio but are not a repository type.
Do not generate 95×all-types blindly; create a small fit-for-principle bundle.

## 12. Stage F — Educator Kit
Recommended SCR + authoritative framework mappings + SCR Pedagogical Templates + Course/Subtopic/Application Context + educator constraints → contextualized Educator Kit.
Kit should show: why SCR fits, learning outcome, framework alignment, activity, task, expected evidence, assessment, resources, provenance.
Generated educator-specific kits are not canonical ontology truth.

## 13. Implementation after D/E/F freeze
- Neo4j AuraDB Free.
- Python controlled traversal.
- MiniLM service reproducing Design-8a behavior.
- Framework/pedagogy nodes and kit-generation API/UI.
- Admin UI concept: Course → Module → Topic → Connects.

## 14. Decision-record conventions
For important design changes record:
Observed issue | Technical diagnosis | Alternatives considered | Decision made | Why | Validation evidence | Rejected approach | Regression condition | Design principle.

Key why-not rules:
- No global framework retrieval.
- Framework cannot create SCR.
- No SCR×Course canonical mappings.
- No inferred external-case targets/indicators.
- No negative facets as positive evidence.
- No production-perfection chasing for V1 demonstrator.

## 15. Immediate next actions in Project - Design 7
1. Review the v0.5 complete framework mapping draft by sampling strong, weak and conditional mappings across ecology, circularity, equity, governance, energy, economics, knowledge/traditional practice and social cohesion.
2. Resolve the Commonwealth repository visibility discrepancy (README 1089/1026 vs currently exposed 1000/1000 K/S rows) before final Stage-D freeze.
3. Re-run exact-ID referential integrity after the missing CF rows are accessible.
4. Freeze Stage-D canonical mapping when mapping quality and source completeness are accepted.
5. Move to Stage E SCR Pedagogical Repository.
6. Then Stage F Educator Kit specification/sample kits.
7. Only after D/E/F freeze, implement the external Neo4j/Python/MiniLM demonstrator.


## 13. Stage D framework mapping — full Commonwealth source resolved (2026-09-18)
- User uploaded `Curriculum_Framework_Lean_v1(1).xlsx`, giving direct access to the full Commonwealth lean repository: 1,089 Knowledge + 1,026 Skill + 986 Value outcomes + 5 competency clusters.
- This resolved the earlier source-visibility problem where only 1,000 Knowledge and 1,000 Skill rows were available to indexed text retrieval.
- The previously inaccessible tail contained 89 Knowledge + 26 Skill records, primarily SDG16/17.
- Re-review rule: same-SDG membership only narrows the candidate pool; it never creates a mapping. Add all substantively relevant outcomes, with no artificial one-Knowledge/one-Skill/one-Value cap.
- Education-level pool remains: Tertiary education + TVET + Adult education. Tertiary is default for formal higher education; TVET and Adult are retained when their applied/workplace/community orientation adds pedagogical value.
- Canonical mapping workbook remains lean with one sheet and six runtime columns: `SCR_ID`, `Framework_Element_ID`, `Relationship_Type`, `Mapping_Role`, `Education_Level`, `Applicability_Condition`.
- Review/status/rationale/coverage/source-QA stay in a separate review workbook.
- Exact framework IDs are mandatory and must resolve in authoritative repositories; do not fabricate IDs from naming patterns.
- Updated Stage-D files:
  - `SCR_Framework_Mapping_Lean_v0.6_Complete_FullCF.xlsx`
  - `SCR_Framework_Mapping_Review_v0.6_Complete_FullCF.xlsx`
- Current complete mapping counts after full-source resolution:
  - Total canonical mapping rows: 1,818
  - Reviewed SDG mappings retained: 674
  - UNESCO ESD Learning Objective mappings: 117
  - UNESCO ESD Competency mappings: 177
  - Commonwealth Knowledge mappings: 274
  - Commonwealth Skill mappings: 264
  - Commonwealth Value mappings: 169
  - Commonwealth Competency mappings: 143
  - CORE rows: 1,089
  - CONDITIONAL rows: 729
- 64 new source-resolved mappings were added from the newly accessible Commonwealth records after mechanism/scope review.
- Full Commonwealth referential-integrity check passes for all CF IDs in the canonical mapping.
- Formula/error scan passes for both canonical and review workbooks.
- Remaining justified abstentions are deliberate and must not be filled merely for coverage symmetry.
- Next action: perform a final semantic spot-review / benchmark of the complete 95-SCR Stage-D mapping, then freeze Stage D and proceed to Stage E — SCR Pedagogical Repository.

## 14. Continuity instruction for new chat `Project - Design 7`
When a new project chat is opened, use this handoff as the continuity baseline together with the frozen V1 runtime decisions. Do not restart architectural decisions already frozen. Preserve the distinction between Design-8a runtime, Design-9 future research architecture, canonical repositories, review artifacts, and runtime/generated educator outputs.
