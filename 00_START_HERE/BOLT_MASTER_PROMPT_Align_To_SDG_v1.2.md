# BOLT.NEW MASTER IMPLEMENTATION PROMPT — v1.2
## Align To SDG
### An Ontology - Knowledge Graph Driven Recommendation System for Integrating Sustainability Concepts in Higher Education Curricula
#### Controlled full-stack alternate implementation trial — Master Prompt v1.2 (2026-09-27)

You are implementing a **complete V1 alternate-technology implementation** of an already-designed and already-validated research system.

**System name:** **Align To SDG**

**Short description:** **An Ontology - Knowledge Graph Driven Recommendation System for Integrating Sustainability Concepts in Higher Education Curricula**

The visible product name throughout the educator-facing application must be **Align To SDG**. The short description above should be used as the primary product descriptor on the Home/About experience and wherever a formal descriptive subtitle is appropriate. Do not replace the product name with older working titles found in historical design artifacts. Older titles remain valid only as document/provenance references to the same project.

Its purpose is to help educators integrate sustainability concepts into higher-education curricula through a controlled ontology, knowledge graph, semantic evidence, application context, recommendation logic, explainability, and educator-kit workflow.

This is **not a product-design exercise** and it is **not an invitation to redesign the recommendation semantics**. You may choose a different implementation technology stack from the Python reference implementation, but you must preserve the system’s approved architecture, domain semantics, interface behavior, data authority, recommendation logic, provenance, and validation requirements.

The attached package contains the governing design documents, decisions, repositories, algorithm/reference code, validation evidence, benchmark artifacts, UI specifications, and test expectations. Read and index the supplied material before making implementation decisions.

---

# 1. PRIMARY OBJECTIVE

Build the **complete V1 application in one coordinated implementation**, not a screen mock-up, isolated frontend, or partial prototype.

You may internally sequence the work however you consider technically appropriate, but do **not** stop after each subsystem for user approval. Continue through implementation, integration, automated testing, validation, and quality-gate reporting before declaring the trial complete.

The completed trial should include, as far as the Bolt target environment reasonably permits:

1. application shell and navigation;
2. Course → Module → Subtopic curriculum selection;
3. Application Context suggestion/acceptance/entry;
4. optional Teaching Context capture;
5. recommendation generation;
6. Design-8a-equivalent recommendation reasoning;
7. recommendation result display;
8. abstention handling;
9. recommendation trace / explainability;
10. Educator Kit generation and validation;
11. Kit view from persisted immutable snapshot;
12. PDF export from the same Kit snapshot where technically feasible;
13. Knowledge Graph Explorer;
14. governed entity and relationship inspection;
15. deterministic governed path inspection;
16. protected V1 Administration area, preserving repository read-only/static/prototype scope while adding the explicitly approved basic User Management extension;
17. authentication and role-based access;
18. My History and Save for Later;
19. Application Help / Help Center plus governed context-sensitive help;
20. repository validation / compilation and import into a controlled runtime database/store;
21. operational persistence needed by V1;
22. published/previewable application review package;
23. automated unit, integration, contract, UI, and parity tests;
24. final implementation-quality and parity report.

Do not mark the implementation complete merely because the application builds or the screens render.

---

# 1A. CONTROLLED V1 EXTENSION — APPLICATION HELP, AUTHENTICATION, USER HISTORY, SAVED ITEMS, RUNTIME DATABASE, AND PUBLISHED REVIEW

The following items are explicit implementation decisions for the Bolt trial dated 2026-09-27. They extend the V1 application experience and operational persistence without changing recommendation semantics, canonical repository authority, Design-8a behavior, or Stage-F semantics.

## 1A.1 Application Help and context-sensitive help

The existing context-sensitive Help design is mandatory and is already governed by `UI_Help_Content_Repository_v0.3.xlsx`.

Implement both:

1. **Context-sensitive Help**
   - resolve static field/page help by stable `Help_Key`;
   - provide inline or on-demand help for Application Context, generated context suggestions, Teaching Context, recommendation results, trace/explainability, Educator Kit, Knowledge Graph controls, and other governed UI elements;
   - do not hard-code contradictory duplicate help text inside business logic;
   - repository/entity descriptions continue to come from their authoritative repository/runtime object.

2. **Application Help / Help Center**
   - provide a persistent Help entry in the application header/navigation;
   - include Getting Started, Navigation, Feature Guide, Create a Recommendation, Application Context, Teaching Context, Recommendation Result, Why this recommendation?, Educator Kit, Save for Later and My History, Knowledge Graph Explorer, Administration (visible only when authorised), data/privacy basics, and troubleshooting;
   - use the existing Help Content Repository wherever a matching `Help_Key` exists;
   - any new global navigation/help-center copy is application UI content, not recommendation evidence and not canonical ontology data;
   - keep Help searchable or clearly sectioned where practical;
   - Help content must never modify, override, or become input to Recommendation Core decisions.

The Home page must make first-time navigation clear without requiring ontology/repository terminology.

## 1A.2 Authentication and basic user management

Implement basic authentication and role-based access suitable for a research/pilot application.

Minimum roles:

- `EDUCATOR`
- `ADMIN`

Minimum behavior:

- unauthenticated users may view only the landing/about/help experience unless the selected implementation provides an equally safe controlled alternative;
- recommendation creation, personal history, saved items, persisted Kits, and Administration require an authenticated user;
- Administration remains protected and must verify authorisation server-side, not merely hide navigation;
- passwords/credentials are owned by the authentication provider and must never be stored in application tables or exposed to administrators;
- secrets must not be embedded in client-side code.

Add a **User Management** subsection to protected Administration as an explicit operational-security extension. This is separate from canonical repository administration.

At minimum, authorised admins should be able to:

- view user display name/email/role/status/created date/last sign-in where the provider exposes it;
- assign or change `EDUCATOR` / `ADMIN` role;
- activate/deactivate application access where the chosen auth provider supports it;
- inspect basic user activity metadata without exposing private recommendation content unnecessarily.

User management must **not** create any canonical repository mutation capability.

## 1A.3 Runtime repository database

The canonical source files remain the source/release authority.

For the Bolt implementation, validate and import/compile the governed repositories into a persistent runtime database or equivalent runtime store so the application does not repeatedly query raw Excel/CSV files for every interaction.

If PostgreSQL/Supabase or an equivalent relational store is selected, create controlled runtime tables for the governed repository entities and Stage-F support repositories. Preserve canonical IDs, relationship direction/type, status/version fields, and release/source provenance.

At minimum, the runtime store must represent:

- Course, Module, Subtopic;
- KCR, KPR, KFR, SCR;
- Guardrail, Application Context;
- SDG Goal/Target/Indicator;
- ESD Objective/Competency;
- Curriculum Framework Knowledge/Skill/Value/Competency;
- governed relationships;
- SCR Framework Mapping;
- Pedagogical Template repository;
- Template Output Element Contract repository;
- Framework Context Resolver;
- Teaching Case/Evidence repository.

Recommended separation:

- canonical/runtime repository tables: read-only to the normal application;
- operational application tables: users/profiles, recommendation events/snapshots, educator decisions, saved-item state, Kit snapshots, audit events.

The database is a **runtime mirror / compiled store**, not a replacement source of truth. Do not permit normal Admin UI edits to silently become canonical data. Repository refresh must originate from the governed source package and pass validation/compilation gates.

Record a repository-release identifier/version and source hashes where practical so persisted recommendations can be tied to the repository version used.

The graph runtime may be reconstructed/cached from the database/runtime store. The exact graph library may differ from NetworkX, but graph semantics must remain controlled and parity-tested.

## 1A.4 Recommendation persistence, My History, and Save for Later

Persistence and educator history are now required application behaviors.

Every successful recommendation execution and valid abstention must create the governed immutable operational records required for reproducibility, including the `RecommendationContextSnapshot` and `RecommendationEvent`, associated with the authenticated user.

Technical failures remain TechnicalError/AuditEvent outcomes and must not be fabricated as successful recommendation history.

Add **My History** to the educator experience.

My History must:

- show the authenticated user's own recommendation executions;
- never expose another user's private history to a normal educator;
- show useful readable metadata such as date/time, Course, Module, Subtopic, Application Context summary, recommendation/abstention status, primary sustainability principle when available, Kit status when available, and saved state;
- support basic search/filter/sort where practical;
- open persisted snapshots/results without silently rerunning Recommendation Core;
- preserve the original repository/model/version provenance.

The existing educator decision `SAVE_FOR_LATER` remains authoritative as an educator action.

Add a visible **Save for later** action on the Recommendation Result and/or Educator Kit where the governing UI permits it.

Saving must:

- persist an `EducatorDecision` with `SAVE_FOR_LATER`;
- link the action to the authenticated user and the immutable RecommendationEvent / EducatorKitSnapshot;
- never copy or overwrite canonical repository/template data;
- never regenerate the recommendation or Kit.

A lightweight user-specific bookmark/saved-item table may be used as an implementation detail to support current saved/unsaved UI state, provided it does not replace the governed EducatorDecision audit record or alter recommendation semantics.

Provide a **Saved** filter/view within My History rather than inventing a second recommendation store.

## 1A.5 Navigation

Use a clear authenticated application navigation such as:

`Home | Create Recommendation | My History | Knowledge Graph | Help`

Show `Administration` only to authorised admins.

The two principal domain capabilities remain Create a Recommendation and Knowledge Graph Explorer. My History and Help are supporting application capabilities.

## 1A.6 Published application review

The Bolt trial is intended to be reviewed as a running application.

When the implementation is complete:

- produce a working Bolt preview and, when supported by the target environment, publish/deploy the application;
- provide the live preview/published URL or explicit publish steps if direct publication requires a user action;
- provide setup instructions for the first admin account and test educator account without hard-coding reusable passwords/secrets into source control;
- provide an `APPLICATION_REVIEW_CHECKLIST.md` covering login, navigation, help, recommendation creation, abstention, trace, Save for later, My History, persisted Kit view, Knowledge Graph Explorer, Admin/User Management, access control, and logout;
- expose build/version information in an About/System Information surface so the reviewed deployment can be tied to the implementation version.

Do not claim the published application is parity-complete unless the parity gates pass.

---

# 2. IMPLEMENTATION FREEDOM VS. SEMANTIC IMMUTABILITY

You are explicitly allowed to try an alternate technology stack.

## 2.1 You MAY change implementation technology

You may choose or replace:

- programming language/runtime;
- frontend framework;
- component library;
- styling implementation;
- graph-processing library;
- graph-visualisation implementation;
- schema-validation library;
- CSV/XLSX ingestion library;
- in-memory data structures;
- embedding inference runtime;
- vector/numeric library;
- persistence technology;
- database access library;
- state-management library;
- API/transport mechanism;
- caching implementation;
- testing framework;
- build tooling;
- deployment packaging.

Suitable candidates may include, but are not mandated:

- TypeScript;
- React;
- Vite or another compatible web build system;
- Zod or equivalent runtime schema validation;
- Graphology or another directed multi-graph-capable library;
- Cytoscape.js or equivalent for visual graph exploration;
- Transformers.js / ONNX / WASM for MiniLM inference;
- PostgreSQL / Supabase or another appropriate persistent store;
- Vitest and a suitable browser/UI test framework.

Choose technologies that are actually supported by the Bolt/StackBlitz target environment. Prefer open-source/free components where practical. Avoid adding a paid external dependency merely for convenience. If a paid or proprietary dependency appears necessary, identify it as a proposal rather than silently introducing it.

## 2.2 You MUST NOT change approved system semantics

Technology choices may change. The following may not change unless explicitly labelled as an unapproved proposal and kept out of the accepted implementation path:

- ontology meaning;
- canonical repository authority;
- Course → Module → Subtopic hierarchy;
- Subtopic-first recommendation anchoring;
- controlled graph traversal policy;
- technical-scope resolution semantics;
- Application Context precedence;
- Teaching Context role;
- eligibility-before-ranking principle;
- guardrail semantics;
- abstention semantics;
- Design-8a primary recommendation behavior;
- Design-8a secondary promotion behavior;
- explicit-negation veto behavior;
- recommendation provenance;
- Kit template/contract semantics;
- persistence meaning of operational/provenance entities;
- V1 UI scope;
- V1 Admin scope;
- benchmark/gold isolation.

The validated Python implementation is the **behavioral reference oracle**, not necessarily the mandated deployment technology.

---

# 3. SOURCE-AUTHORITY ORDER

The package contains both current and historical material. Earlier artifacts may exist for traceability and must not automatically override later reconciled decisions.

Use this authority order when interpreting the package:

1. **DO_NOT_CHANGE / frozen rules supplied with this package**;
2. **current reconciled V1 specifications and decision registers**;
3. **frozen Design-8a reference runtime and accepted Design-8a behavior**;
4. **SEQ-11 to SEQ-15 implementation, verification, parity and compilation decisions**;
5. **current canonical/frozen repositories and contracts**;
6. **earlier/historical design material**, only for rationale or chronology.

If two artifacts appear inconsistent:

- do not silently reconcile them;
- identify the conflict;
- use the later/current governing artifact where authority is clear;
- otherwise classify the item as `BLOCKED_REQUIRES_REVIEW` rather than inventing behavior.

Do not reintroduce superseded functionality merely because it appears in an older design document.

---

# 4. MANDATORY SYSTEM BEHAVIOR

## 4.1 Curriculum anchor

Normal V1 recommendation entry requires:

**Course → Module → Subtopic**

The selected Subtopic is the authoritative curriculum anchor.

Do not introduce an unrestricted public text-only recommendation route in V1.

Do not silently re-anchor a selected curriculum item because semantic similarity suggests another one.

A scope conflict must remain an explicit mismatch/review outcome according to the governing design.

## 4.2 Controlled graph expansion

Preserve the controlled hierarchical expansion policy.

Use the narrowest explicit evidence first.

Conceptually:

1. selected Subtopic;
2. directly mapped KCR evidence;
3. applicable KPR/KFR and governed evidence;
4. at most the permitted curated parent/related-concept expansion defined by the frozen design;
5. Module fallback only when narrower evidence is insufficient;
6. Course fallback only after narrower scopes are insufficient.

Do not implement unrestricted graph wandering.

A valid Subtopic-level recommendation should generally outrank an equally strong broader Module/Course inference because it is more specific and has a shorter explicit evidence path.

Prerequisite concepts are readiness/preparation evidence; they are not substitutes for the selected technical anchor.

## 4.3 Application Context

The public V1 runtime source values are exactly:

- `EDUCATOR_ENTERED`
- `ACCEPTED_SYSTEM_GENERATED`

An educator-entered Application Context is primary.

If an educator types their own Application Context after accepting a system suggestion, the educator-entered context supersedes the accepted generated context on the main recommendation path, while provenance of what was shown/accepted remains available.

Generated context candidates must be established as compatible/eligible **before** semantic ranking.

Semantic similarity may rank eligible context candidates. It must not create compatibility by itself.

Do not allow generated context to override educator intent.

## 4.4 Teaching Context

Teaching Context may influence:

- pedagogical fit;
- activity format;
- feasibility;
- class-size adaptation;
- available-time adaptation;
- assessment preference;
- Educator Kit presentation/content.

Teaching Context must **not** create, change, remove, or re-rank sustainability recommendation eligibility.

## 4.5 Semantic similarity

Semantic similarity is supporting evidence, not ontology authority.

The reference embedding model is:

`sentence-transformers/all-MiniLM-L6-v2`

Reference embedding dimension:

`384`

You may change the **execution runtime** of the model—for example Python SentenceTransformers → JavaScript/ONNX/WASM execution of the same model—without changing the model semantics.

Do not silently substitute a different embedding model.

If the exact reference model is technically impossible in the chosen Bolt implementation:

1. keep the main implementation clearly marked as not yet parity-qualified;
2. identify the substituted model as `EXPERIMENTAL_MODEL_SUBSTITUTION`;
3. run the complete frozen parity suite separately;
4. do not claim Design-8a equivalence unless the required gates are satisfied.

No hidden semantic fallback is allowed.

## 4.6 Recommendation eligibility and ranking

Preserve:

**technical scope → mechanism evidence → guardrail/boundary checks → evidence support → eligible set → ranking/promotion → provenance**

Eligibility must precede ranking.

`RELATED_TO_SCR` must not be used as an eligibility shortcut.

Semantic similarity alone must not establish SCR eligibility.

Gold labels must never be prediction input.

Do not add test-case-specific boosts.

Do not tune ranking or thresholds merely to reproduce individual benchmark labels.

## 4.7 Design-8a primary and secondary behavior

Preserve the frozen Design-8a recommendation behavior.

Key invariants include:

- validated primary Top-1 path is unchanged;
- strong curated-context promotion remains a valid path where allowed by the frozen design;
- independent secondary SCRs are discovered facet-locally rather than only from the global Top-N list;
- canonical promotion evidence includes the governed SCR name/keywords/mechanism/trigger/core ideas/boundary content used by the frozen runtime;
- lexical evidence is specificity-aware;
- a secondary requires facet-specific semantic support plus the required specific canonical or curated-context support;
- the primary SCR may claim multiple facets where sufficiently specific and no materially stronger alternative exists;
- raw global ranking and promoted/display ranking remain distinguishable for audit;
- `RELATED_TO_SCR` is not promotion eligibility evidence;
- gold labels are never read by prediction code.

Use the authoritative SEQ-07 algorithm specification and frozen Design-8a runtime for exact parameters, thresholds and field behavior. Do not alter those values during this experiment.

## 4.8 Explicit negation and exclusion

Positive mechanism facets support discovery/ranking.

Explicitly negated/excluded facets are **conflict/veto evidence only**.

They are not positive mechanism evidence.

Explicit exclusion overrides semantic similarity or contextual similarity for secondary promotion where the frozen Design-8a rules require it.

No recommended/promoted SCR may simultaneously remain in the Design-8a negation-veto set.

---

# 5. REPOSITORY AND DATA AUTHORITY

The attached repository set is authoritative source material.

The repository system includes governed entities such as:

- Course;
- Module;
- Subtopic;
- KCR;
- KPR;
- KFR;
- SCR;
- Guardrail;
- Application Context;
- SDG Goal/Target/Indicator;
- ESD Objective/Competency;
- Curriculum Framework Knowledge/Skill/Value/Competency;
- pedagogical/template repositories;
- framework/context resolver repositories;
- output-element contracts;
- teaching/evidence repositories;
- governed relationship records.

Do not:

- invent missing canonical entities;
- infer and write new canonical edges merely from semantic similarity;
- silently repair source data;
- rewrite IDs;
- collapse distinct entity types;
- force unresolved benchmark coverage gaps to resolve through ranking changes.

Where a canonical value is missing, represent the gap explicitly rather than fabricating content.

Authoring workbooks/CSV files are source/release artifacts, not necessarily the live query representation.

The implementation may validate and compile them into runtime-optimized structures.

For this Bolt trial, the preferred runtime pattern is:

`governed source files → validation/compilation → versioned runtime database/store → in-memory/cached graph + semantic runtime`

The runtime database/store may use a different physical schema from the source files, but canonical IDs and governed meanings must remain lossless. Repository tables are runtime mirrors and must remain read-only to normal application workflows. Operational/user/history tables must be logically separated from canonical/runtime repository tables.

---

# 6. REPOSITORY VALIDATION / COMPILATION

Implement or preserve equivalent checks for:

- expected files;
- expected headers;
- required nonblank IDs;
- duplicate IDs within a source;
- global duplicate IDs where prohibited;
- relationship endpoint referential integrity;
- governed relationship types;
- duplicate-edge diagnostics;
- hierarchy endpoint typing;
- controlled values and states;
- build readiness;
- deterministic compiled artifacts/manifests.

Repository validation/build is development/deployment tooling in V1. It is **not** a functional public Admin publication workflow.

Canonical repository source remains authoritative.

Runtime recommendation output must never write back into canonical repository source.

---

# 7. OPERATIONAL / PROVENANCE MODEL

Preserve the conceptual meaning of the following operational entities even if the physical database implementation differs:

- `RecommendationContextSnapshot`
- `RecommendationEvent`
- `EducatorKitSnapshot`
- `EducatorDecision`
- `AuditEvent`

Recommendation trace/explanation must be derived from persisted recommendation evidence/provenance, not independently regenerated from general model knowledge.

The transient ontology-aware runtime profile (for example TopicSemanticProfile) is **not** a canonical persistent ontology node.

Do not create persistent canonical nodes such as `TopicSemanticProfile_*`.

Associate operational recommendation/Kit records with the authenticated user for access control and My History.

Persist `SAVE_FOR_LATER` as an `EducatorDecision`. A separate user-specific bookmark/saved-state table is allowed only as an implementation convenience for the current UI state.

Opening history, saved items, or a persisted Kit is a read operation. It must not rerun recommendation logic, re-resolve templates/frameworks, or regenerate Kit content.

---

# 8. EDUCATOR KIT

Preserve the approved Stage-E / Stage-F separation.

After a `Template_ID` has been selected, the Pedagogy Kit Contract Resolver / output-element contract determines the exact required elements for that template.

The generation layer must populate required elements with complete ready-to-use content.

Generic statements and placeholders do not satisfy the output-element contract.

Validation checks the generated Kit against the same contract and records outcomes including PASS / FAIL / NOT_APPLICABLE as governed by the current design.

No automatic repair/regeneration loop is included in V1.

If validation fails:

- do not present a half-valid Kit as READY;
- preserve the recommendation result;
- record the failed Kit validation/provenance state;
- do not silently regenerate until it passes.

Normal Kit view renders from the persisted immutable `EducatorKitSnapshot`.

Opening or refreshing a Kit must not:

- rerun the Recommendation Core;
- change Template_ID;
- re-resolve framework mappings;
- invoke generation again;
- alter the persisted snapshot.

V1 export scope is PDF only where export is implemented.

HTML and Excel Kit export remain deferred.

The in-app view and PDF must derive from the same immutable snapshot, with differences limited to presentation.

---

# 9. KNOWLEDGE GRAPH EXPLORER

The Knowledge Graph Explorer is read-only and conceptually separate from Recommendation Core traversal.

It should provide access to the complete governed graph, using visual filtering/focus to improve readability rather than semantically reducing what is available.

Normal educator-facing views hide canonical IDs unless needed for technical/audit views.

Preserve exact source entity, target entity, relationship type, and direction.

Do not invent friendly relationship meanings when governed relationship metadata is absent.

If relationship meaning is unavailable, show the exact type/direction and explicitly indicate the metadata gap.

A visible node, edge, or path in the Explorer does **not** establish Recommendation Core eligibility or ranking.

For governed path inspection:

- inputs use canonical start and end entity IDs internally;
- compute one shortest **directed** governed path by hop count;
- apply deterministic tie-breaking using a stable traversal order consistent with the governing design;
- `NO_GOVERNED_PATH` is a valid domain outcome, not a technical error;
- visual display filters must not silently alter path semantics.

---

# 10. V1 ADMINISTRATION SCOPE

Administration is protected and visually separate from normal educator workflows.

Current V1 Administration is read-only/static/prototype-oriented.

Do not silently implement canonical repository mutation/publication capabilities that are deferred beyond V1.

V1 may include, where supported by the current artifacts:

- system/repository overview;
- active/version metadata display;
- read-only repository/entity inspection;
- validation/status summaries where real evidence exists;
- demonstrative/static preparation screens clearly labelled as such.

Do NOT introduce as active V1 behavior unless current governing artifacts explicitly require it:

- canonical repository authoring;
- arbitrary workbook upload becoming canonical;
- staging/publishing releases;
- automatic build/publication workflow;
- functional rollback;
- benchmark-triggered auto-tuning;
- hidden mutation endpoints.

If historical documents describe those as future-state concepts, keep them historical/future-state only.

### Explicit 2026-09-27 Admin extension: User Management

Basic user/auth administration is now in V1 for the Bolt trial and is **not** considered canonical repository mutation.

Administration may therefore include a functional User Management area for role/status/access control, while repository authoring/publication remains deferred/read-only as stated above.

Do not expose passwords, auth-provider secrets, or unrestricted cross-user recommendation content.

---

# 11. PUBLIC INTERFACE BEHAVIOR

Preserve the current logical contracts even if transport changes.

A recommendation request is conceptually self-contained and includes the final curriculum anchor and Application Context state needed for reproducibility.

Preserve the current distinction between domain outcomes and technical errors.

Recommendation domain status is:

- `SUCCESS`
- `ABSTAINED`

Technical/infrastructure failures use a separate TechnicalError path and must not become domain recommendation statuses.

V1 abstention reasons include the governed states such as:

- `INSUFFICIENT_EVIDENCE`
- `NO_DEFENSIBLE_SUSTAINABILITY_MECHANISM`

Do not turn abstention into technical failure.

Do not turn technical failure into abstention.

The recommendation result must preserve the current readable primary recommendation, any supported additional principles, provenance/event/snapshot identifiers, trace availability, and Kit availability semantics required by the governing contracts.

---

# 12. UI / EXPERIENCE REQUIREMENTS

## 12.1 Product identity and naming

Use the following product identity consistently across the implementation:

- **Visible system name:** `Align To SDG`
- **Short description:** `An Ontology - Knowledge Graph Driven Recommendation System for Integrating Sustainability Concepts in Higher Education Curricula`

Rules:

- `Align To SDG` is the primary name in the header, Home page, navigation context, About/help content, page metadata, and user-facing product references.
- The short description may appear on the Home page, About section, sign-in/landing context if used, and formal project-information surfaces; avoid repeating the full description on every working screen.
- Do not expose the older working title as the primary user-facing product name.
- Preserve older document titles unchanged when citing provenance or source documents.
- Do not abbreviate the product to `ATSDG` or invent another brand name unless explicitly requested.
- Keep the visual treatment academic, credible, restrained, and accessible; the name is a product identity, not a marketing slogan.


Implement the complete application, not merely isolated UI screens.

The current UI baseline is clean, restrained, academic, spacious, and accessible. Avoid a crowded dashboard aesthetic.

Use progressive disclosure:

**Use → Understand → Inspect/Audit**

Internal IDs should not dominate the normal educator experience.

The two primary domain capabilities are:

1. Create a Recommendation
2. Knowledge Graph Explorer

Supporting authenticated capabilities are:

- My History, including Saved items;
- Help / Application Help.

Administration appears only for authorised admins.

Use clear navigation such as `Home | Create Recommendation | My History | Knowledge Graph | Help`, with `Administration` added only for authorised admins.

The normal recommendation journey should make the current Course → Module → Subtopic and Application Context state obvious to the educator.

Context-sensitive help is mandatory and must resolve from the governed Help Content design by stable `Help_Key` where available. In addition, implement an Application Help / Help Center covering navigation, features, workflows, history/save behavior, KG use, Admin scope, and troubleshooting.

### UI inspiration

Use the following only as interaction/design inspiration. Do not copy branding, proprietary screen layouts, logos, or visual identity.

**Initial inspiration references:**

- Apple — restraint, whitespace, hierarchy, limited primary actions, visual calm;
- Brilliant.org — guided flow, progressive disclosure, approachable card-based interaction;
- Our World in Data ETL/DAG interface — inspectability, structured dependency/graph navigation.

**Additional KG-specific reference used later:**

- arcmodel.io — graph-canvas interaction and entity/relationship exploration patterns.

The governing UI documents in the package override any aesthetic interpretation from those websites.

---

# 13. ACCESSIBILITY / RESPONSIVENESS

Preserve the current accessibility intent.

At minimum:

- logical heading structure;
- keyboard navigation matching visual order;
- visible focus state;
- accessible labels;
- sufficient contrast;
- meaningful empty/error/loading states;
- controls usable at narrow widths;
- responsive stacking where appropriate;
- graph interactions with non-visual/textual inspection alternatives where feasible.

Do not sacrifice clarity for decorative animation.

---

# 14. SECURITY / ACCESS RULES

Preserve the approved separation between:

- public educator experience;
- protected Administration experience;
- internal service/data boundaries.

Do not treat hidden IDs as authorization.

Keep secrets server-side or in the appropriate secure environment mechanism.

Do not place API keys or credentials in client-visible code or repository content.

Treat educator-entered free text and repository text as untrusted data at generation boundaries.

Do not allow prompt injection from source content to redefine system rules.

Use parameterized database operations or equivalent safe data-access methods.

Do not log secrets.

Do not silently fall back to an unregistered provider/model when a configured provider/model fails.

Technical failures must be explicit.

Authentication/authorization rules for this Bolt trial:

- protect educator persistence/history and all Admin routes with authenticated sessions;
- enforce `EDUCATOR` / `ADMIN` authorization server-side or at the trusted data/service boundary;
- apply row-level/user-ownership controls so educators cannot read another educator's private history/saved items;
- user-management privileges are Admin-only;
- passwords remain with the auth provider and are never copied into application tables;
- published/preview deployments must not leak service-role keys, API keys, or database secrets into client bundles.

---

# 15. TECHNOLOGY DECISION REQUIREMENT

Before implementation, inspect the target environment and select an alternate stack that can realistically run there.

Create an implementation decision record such as:

| Component | Python reference | Bolt implementation | Reason | Parity risk | Validation |
|---|---|---|---|---|---|
| UI | Streamlit | chosen web framework | reason | Low/Med/High | tests |
| Graph runtime | NetworkX | chosen graph engine | reason | risk | graph/parity tests |
| Embeddings | SentenceTransformers | chosen MiniLM runtime | reason | risk | semantic/parity tests |
| Runtime validation | Pydantic | chosen validator | reason | risk | contract tests |
| Persistence | SQLite/Postgres concept | chosen store | reason | risk | persistence tests |
| Testing | pytest | chosen test stack | reason | risk | test suite |

Do not mechanically translate Python line-by-line into TypeScript.

Prefer **behaviorally equivalent implementation** over literal code translation.

Where a different data structure/library better preserves the required semantics, use it and document the rationale.

---

# 16. FROZEN VALIDATION ORACLE

The accepted/frozen Python Design-8a behavior is the parity reference.

A fresh MiniLM Colab rerun has reproduced the accepted baseline.

Use the attached validation artifacts as the governing evidence.

The accepted reference includes, at minimum:

- Regression15: **15/15 legacy pass**
- Educator input suite: **24/24 end-to-end**
- Generated-context quality: **4/4**
- Forbidden promoted violations: **0**
- Promoted/vetoed overlap: **0**
- ALL59 executions: **59**
- recommendation-ready: **46**
- coverage gaps: **13**
- ALL59 strict end-to-end: **30/46**
- promoted precision: approximately **69.8%**
- promoted recall: approximately **65.2%**
- promoted F1: approximately **67.4%**
- unsupported inference: **0**
- counterfactual direction: preserved in the accepted suite.

Do not “improve” these metrics by changing the ontology, thresholds, gold labels, or ranking logic during the parity exercise.

The purpose of parity is equivalence, not score optimization.

Coverage gaps remain ontology/repository coverage issues unless separately onboarded. Do not fix them through ranking changes.

Some frozen multi-label rows are expert-review/benchmark-ambiguity items rather than safe tuning targets. Do not force-tune the engine to those labels.

---

# 17. PARITY RULES

## 17.1 Exact decision parity

For the frozen cases, match the reference behavior exactly where the governing parity harness requires it, including fields such as:

- `Resolution_Type`
- `Resolution_ID`
- `Selected_KCR_IDs`
- `Evidence_Node_IDs`
- `Scope_Status`
- `Recommended_SCR_ID`
- `Promoted_SCR_IDs`
- `Decision_Status`
- `Negation_Vetoed_SCR_IDs`

Use the attached parity harness/contracts for the complete authoritative field list.

## 17.2 Numeric parity

Cross-runtime floating-point/embedding scores may be compared using the approved tolerance rather than byte equality.

Do not relax domain decisions merely because low-level floating-point values differ.

If model execution produces materially different rankings or eligibility outcomes, treat that as a parity failure requiring investigation.

---

# 18. REQUIRED QUALITY GATES

The implementation must report PASS / FAIL / BLOCKED for each gate.

## QG-01 — Repository Integrity

Confirm:

- required repository inputs available;
- schema/header checks pass;
- IDs valid;
- referential integrity valid;
- governed relationship types valid;
- expected hierarchy typing valid;
- no silent source repair.

## QG-02 — Contract Integrity

Confirm:

- runtime request/response structures match governed contracts;
- controlled enums preserved;
- domain outcomes are separated from TechnicalError;
- no undocumented fields redefine behavior.

## QG-03 — Graph Integrity

Confirm:

- direction preserved;
- relationship type preserved;
- multi-edge semantics preserved where required;
- controlled traversal preserved;
- deterministic governed path behavior preserved;
- graph exploration does not alter recommendation logic.

## QG-04 — Semantic Engine Integrity

Confirm:

- reference model or explicitly declared experimental substitution;
- expected 384-dimensional reference output when using all-MiniLM-L6-v2;
- no silent fallback model;
- cosine/similarity behavior tested;
- semantic similarity does not create ontology authority.

## QG-05 — Design-8a Recommendation Parity

Run the available frozen regression/parity suite and compare against the Python oracle.

Do not claim equivalence if required decisions differ.

## QG-06 — Educator Input Regression

Target accepted behavior:

**24/24 end-to-end**

Preserve input precedence, normalization, conflict handling, and context-required behavior.

## QG-07 — Negation / Safety

Target:

- forbidden promoted violations = **0**;
- promoted/vetoed overlap = **0**;
- explicit negation remains veto/conflict evidence only.

## QG-08 — UI Contract Fidelity

Confirm every functional UI control/result maps to an approved repository/runtime field or design constant.

No UI action may create hidden business behavior not present in the governing contracts.

## QG-09 — Educator Kit Contract Fidelity

Confirm:

- correct template/output-element contract resolution;
- all required elements complete;
- no placeholders accepted as complete content;
- validation status correctly enforced;
- failed Kit not shown as READY;
- snapshot immutability preserved;
- no automatic repair loop.

## QG-10 — Application Quality

Confirm:

- production build succeeds;
- automated tests pass;
- no critical runtime console/server errors in normal flows;
- recommendation workflow operates end-to-end;
- abstention workflow operates;
- technical-error workflow operates;
- Kit workflow operates where supported;
- KG Explorer operates;
- protected Admin scope operates as designed;
- responsive/accessibility checks performed.

## QG-11 — Authentication, User Ownership, History, and Saved-State Integrity

Confirm:

- login/session flow works;
- `EDUCATOR` / `ADMIN` authorization is enforced;
- normal educators cannot access another user's private history/saved items;
- every persisted recommendation/abstention is associated with the correct authenticated user;
- My History renders from persisted snapshots/events and does not silently recompute;
- Save for Later persists `EducatorDecision = SAVE_FOR_LATER`;
- saved-state implementation does not alter canonical data;
- Admin User Management works only for authorised admins;
- passwords/secrets are not exposed or stored improperly.

## QG-12 — Help and Published Review Readiness

Confirm:

- contextual Help_Key-driven help is wired into the relevant screens/fields;
- Application Help / Help Center covers navigation and major features;
- Help content cannot influence Recommendation Core decisions;
- published/preview app is accessible for review where the platform permits;
- application version/build identity is visible;
- review checklist and first-admin/test-user setup instructions are provided;
- no deployment secret is exposed in client code.

---

# 19. TEST REQUIREMENTS

Implement automated tests appropriate to the selected stack.

At minimum include:

### Unit tests

For:

- schema validation;
- repository parsing;
- graph utilities;
- controlled traversal;
- similarity calculations;
- negation handling;
- ranking/promotion helpers;
- Kit contract checks;
- persistence mapping.

### Integration tests

For:

- repository compile/load;
- context resolution;
- recommendation service;
- recommendation trace;
- Kit generation/validation;
- graph explorer data flow;
- persistence round-trip.

### Contract tests

For:

- Application Context request/response;
- Recommendation request/result;
- Recommendation trace;
- TechnicalError;
- Kit generation/view/export;
- graph load/inspect/path contracts.

### UI tests

For at least:

- normal recommendation success;
- multi-SCR result;
- abstention: insufficient evidence;
- abstention: no defensible sustainability mechanism;
- TechnicalError;
- accepted generated context;
- educator-entered context precedence;
- Teaching Context not changing recommendation eligibility;
- Kit READY;
- Kit VALIDATION_FAILED;
- graph no-path state;
- protected Admin access behavior.

### Parity tests

Run the supplied frozen cases where executable in the target environment.

If a subset cannot execute in Bolt due to platform limitations, do not fabricate a PASS. Report the gate as `BLOCKED`, explain why, and identify what must be run externally.

---

# 20. REQUIRED DOMAIN-BOUNDARY TESTS

Add explicit tests proving that:

1. Teaching Context cannot alter the SCR recommendation result.
2. KG Explorer browsing cannot alter recommendation state.
3. Visual graph path existence does not automatically establish recommendation eligibility.
4. Internal IDs are not unnecessarily exposed in normal educator-facing views.
5. Abstention is not displayed as TechnicalError.
6. TechnicalError is not converted into `ABSTAINED`.
7. A failed Kit cannot appear READY.
8. Opening a persisted Kit does not regenerate it.
9. PDF rendering, if implemented, does not regenerate Kit content.
10. educator-entered Application Context overrides accepted generated context for the main path.
11. semantic similarity cannot create eligibility.
12. explicit negation cannot become positive promotion evidence.
13. gold labels are not available to prediction code.
14. unresolved ontology coverage gaps are not force-mapped by semantic ranking.
15. Help content cannot be consumed as recommendation evidence or alter Recommendation Core output.
16. My History opens persisted results without recomputation.
17. one educator cannot read another educator's private recommendation history/saved items.
18. `SAVE_FOR_LATER` persists separately from canonical repository/template data.
19. Admin user-management permissions do not grant canonical repository mutation.
20. runtime database repository tables cannot be edited through normal educator/Admin UI to become new canonical truth.

---

# 21. WHAT YOU MUST NOT CHANGE

You may change technology. You must not silently change any of the following.

## Recommendation semantics

Do not change:

- Design-8a decision logic;
- primary Top-1 path;
- eligibility-before-ranking;
- controlled hierarchy;
- Subtopic-first specificity;
- scope/mismatch rules;
- guardrail semantics;
- abstention semantics;
- promotion semantics;
- facet-local secondary discovery;
- specificity-aware evidence;
- negation/exclusion veto behavior.

## Ontology/repository authority

Do not:

- invent KCR/KPR/KFR/SCR links;
- infer canonical edges from embeddings;
- generate missing canonical nodes;
- rewrite canonical repository data;
- collapse entity types;
- silently fix unresolved coverage gaps.

## Recommendation evidence

Do not:

- use `RELATED_TO_SCR` as eligibility evidence;
- let semantic similarity establish eligibility;
- use benchmark gold during prediction;
- add case-specific boosts;
- tune thresholds to force frozen answers;
- generate recommendation evidence from an LLM independently of the trace.

## Input semantics

Do not:

- remove Course → Module → Subtopic as the public V1 anchor path;
- silently re-anchor a selected Subtopic;
- allow Teaching Context to change SCR eligibility;
- change Application Context source semantics or precedence.

## Kit semantics

Do not:

- change Stage-E template selection semantics;
- change PKCR/output-element contract semantics;
- omit required output elements;
- use placeholders as valid completion;
- auto-repair/regenerate failed Kits;
- show `VALIDATION_FAILED` as READY;
- regenerate immutable snapshots during view/export.

## V1 scope

Do not silently add:

- functional canonical repository authoring;
- production repository mutation;
- active publication/rollback workflow;
- benchmark-driven auto-tuning;
- downloadable HTML Kit export;
- downloadable Excel Kit export;
- unapproved public text-only recommendation routes.

The explicitly approved 2026-09-27 extensions — authentication, basic User Management, My History, Save for Later, Application Help, and runtime repository database import — are allowed. They must remain operational/UI extensions and must not change recommendation semantics, canonical repository authority, or Stage-F semantics.

Also do not:

- make runtime database rows the new editable canonical authority;
- let Help content become recommendation evidence;
- silently recompute historical/saved recommendations when viewing them;
- expose another user's private history to an educator;
- store plaintext passwords or auth secrets in application tables/source;
- make User Management a backdoor for canonical repository editing.

---

# 22. HOW TO HANDLE PERCEIVED DESIGN PROBLEMS

If you identify what appears to be a design defect, inconsistency, or implementation difficulty:

1. do not silently change the governing behavior;
2. implement the current approved rule when technically possible;
3. create an issue in the Implementation Decision Log;
4. classify it as one of:
   - `NO_BEHAVIOR_CHANGE`
   - `PROPOSED_CHANGE`
   - `BLOCKED`
5. explain the source artifact, problem, proposed option, and likely behavioral impact.

A proposal does not become approved merely because it makes implementation easier.

---

# 23. IMPLEMENTATION DECISION LOG

Maintain a structured decision log throughout the build.

For each material implementation decision record:

- `Decision_ID`
- Requirement / subsystem
- Governing source document/artifact
- Implementation choice
- Why this technology/approach was selected
- Alternatives considered
- Behavioral impact
- Parity risk
- Validation performed
- Status: `NO_BEHAVIOR_CHANGE | PROPOSED_CHANGE | BLOCKED`

---

# 24. FINAL DELIVERABLES

Before declaring the trial complete, provide all of the following in the project/repository.

## 24.1 Runnable application

A complete runnable V1 alternate-stack application.

## 24.2 Clear project structure

Separate at least conceptually:

- UI/presentation;
- contracts/types;
- repository ingestion/validation;
- compiled/runtime repository layer;
- graph engine;
- semantic engine;
- Application Context resolver;
- Recommendation Core;
- trace/explainability;
- Educator Kit subsystem;
- persistence;
- security/access;
- tests.

Avoid a monolithic single-file application.

## 24.3 Technology Architecture Report

Describe:

- selected stack;
- why each major technology was selected;
- how it corresponds to the Python reference architecture;
- deployment implications;
- limitations specific to Bolt/StackBlitz;
- any external services required.

## 24.4 Implementation Decision Log

As defined above.

## 24.5 Quality Gate Report

Show:

- QG-01 through QG-10;
- PASS / FAIL / BLOCKED;
- test evidence;
- unresolved issues.

## 24.6 Parity Report

Show:

- which frozen suites executed;
- reference result;
- actual result;
- exact decision mismatches;
- numeric/tolerance differences;
- forbidden-promotion status;
- negation-veto status;
- unresolved parity blockers.

Do not collapse parity into one overall percentage.

## 24.7 Test Report

Include:

- unit tests;
- integration tests;
- contract tests;
- UI tests;
- parity tests;
- known skipped/blocked tests and reasons.

## 24.8 Known Limitations

Clearly separate:

- implementation limitation;
- Bolt/StackBlitz platform limitation;
- missing source data;
- deferred V1 functionality;
- parity failure;
- proposed future enhancement.

## 24.9 Database Schema and Repository Import Report

Provide:

- selected persistent store;
- canonical/runtime repository table map;
- operational/user/history table map;
- repository release/version/hash strategy;
- import/compile procedure;
- clear statement that runtime repository tables are mirrors, not canonical authoring authority.

## 24.10 Application Help and Review Package

Provide:

- in-app Help / Help Center;
- contextual Help_Key integration;
- `APPLICATION_REVIEW_CHECKLIST.md`;
- live preview/published URL when supported, or explicit publish steps;
- first-admin/test-user setup instructions without hard-coded reusable secrets.

## 24.11 Authentication / User Management Notes

Document:

- auth provider/approach;
- role model;
- user ownership/access controls;
- admin user-management capabilities;
- how recommendation/history ownership is enforced.

---

# 25. BUILD COMPLETION RULE

Do not say “complete”, “production-ready”, “parity achieved”, or equivalent unless the evidence supports that statement.

Use precise completion language:

- `IMPLEMENTATION COMPLETE — PARITY PASS`
- `IMPLEMENTATION COMPLETE — PARITY PARTIAL`
- `IMPLEMENTATION COMPLETE — PARITY FAILED`
- `IMPLEMENTATION PARTIAL — BLOCKED`

A visually complete application with unvalidated Recommendation Core behavior is **not** parity complete.

A Recommendation Core that passes tests while the UI/Kit/KG integration remains incomplete is **not** application complete.

---

# 26. FIRST ACTIONS AFTER READING THIS PROMPT

Without asking the user to approve each subsystem individually:

1. inventory all attached files;
2. classify them as current/frozen, supporting, historical, or validation/reference evidence;
3. identify the authoritative current design set;
4. build an internal requirement matrix mapping requirements to source artifacts;
5. select and document the alternate technology stack;
6. identify environment constraints and any unavoidable blockers;
7. design the runtime repository database import/mirror and operational persistence schema;
8. implement authentication, role-based access, Application Help, My History, and Save for Later together with the complete application;
9. implement the complete application;
10. run automated tests and all quality gates;
11. run available parity suites;
12. publish/provide a reviewable preview when supported and generate the Application Review Checklist;
13. present the finished application together with the Technology Architecture Report, Implementation Decision Log, Quality Gate Report, Test Report, Parity Report, database/import report, auth/user-management notes, and review package.

Do not ask for repeated confirmation merely because the work spans multiple subsystems. Ask the user only when an actual approval is required for an external account/service, a missing indispensable artifact cannot be inferred, or a material design decision would otherwise be changed.

---

# 27. OVERALL SUCCESS CRITERION

The delivered application must present itself consistently as **Align To SDG**, with the approved short description used as the formal product descriptor.


The objective of this Bolt trial is **not** to prove that TypeScript/React or another stack is inherently better than Python/Streamlit.

The objective is to determine whether Bolt can produce a credible, maintainable, high-quality alternate implementation of the same governed V1 system while preserving:

- ontology authority;
- recommendation semantics;
- Design-8a behavior;
- Application Context rules;
- provenance;
- explainability;
- Educator Kit contracts;
- KG exploration semantics;
- V1 scope;
- validation safety.

Technology freedom is allowed.

**Semantic drift is not.**

Begin by reading and classifying the supplied artifacts, then proceed through the complete coordinated build and quality gates.
