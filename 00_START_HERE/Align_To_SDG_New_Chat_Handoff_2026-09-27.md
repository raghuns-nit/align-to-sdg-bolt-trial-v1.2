# Align To SDG — New Chat Handoff — 27 Sep 2026

## 1. Project identity

**System name:** Align To SDG

**Short description:** An Ontology - Knowledge Graph Driven Recommendation System for Integrating Sustainability Concepts in Higher Education Curricula

Treat the next chat as a direct continuation of the Recommendation System / Align To SDG project. Do not redesign frozen semantics unless explicitly reopened.

## 2. Current primary implementation decision

The user's primary implementation choice remains:

**A. Continue with the original Python / Streamlit / NetworkX / sentence-transformers/all-MiniLM-L6-v2 implementation.**

Bolt.new is a controlled full-stack alternate-technology experiment only.

Governing experiment principle:

**Technology freedom; semantic immutability.**

The validated Python Design-8a runtime is the behavioral oracle for any alternate implementation.

## 3. Implementation progress

Completed through:
- SEQ-11 Verification & Validation Plan
- SEQ-12 Git Repository & Project Skeleton
- SEQ-13 Design-8a Reference Parity Harness
- SEQ-14 Repository Validation & Compilation Pipeline
- SEQ-15 Recommendation Core Migration With Parity

Python repository baseline includes validation/compiler tooling, parity harness, frozen Design-8a reference runtime, migrated runtime, service adapter, 19-file runtime repository, tests, and compiled artifacts.

## 4. Fresh full MiniLM validation gate

A fresh Colab rerun of the frozen Design-8a suite was completed on 26 Sep 2026 using the original frozen Colab kit.

Confirmed reference results:
- Regression15: 15/15 legacy pass
- Educator input: 24/24 end-to-end
- Context quality: 4/4
- ALL59: 46 recommendation-ready / 13 coverage gaps
- Strict E2E: 30/46
- Promoted precision: 69.77%
- Promoted recall: 65.22%
- Promoted F1: 67.42%
- Forbidden promoted violations: 0
- Negation promoted/veto overlap: 0
- Unsupported inference: 0

SEQ-13 / SEQ-15 full MiniLM parity gate can therefore be treated as closed.

## 5. Frozen Recommendation Core rules

Preserve Design-8a:
- Course → Module → Subtopic public V1 anchor path
- Subtopic-first specificity
- controlled hierarchical graph expansion
- Application Context precedence
- Teaching Context cannot create/change SCR eligibility
- eligibility before semantic ranking
- semantic similarity supports discovery/ranking but does not create ontology authority
- RELATED_TO_SCR is not eligibility evidence
- primary Top-1 path remains unchanged
- facet-local secondary promotion
- specificity-aware evidence
- explicit negation/exclusion is veto/conflict-only evidence
- gold labels never available during prediction
- no case-specific benchmark tuning

Reference model:
`sentence-transformers/all-MiniLM-L6-v2`, 384 dimensions.

Alternate model execution runtime is allowed in Bolt; a different embedding model is an experimental substitution and cannot claim parity without frozen-suite validation.

## 6. Current V1 UI / product baseline

Visible product name: Align To SDG.

Primary domain capabilities:
- Create a Recommendation
- Knowledge Graph Explorer

Existing current UI design:
- clean, restrained, academic, spacious, accessible
- progressive disclosure: Use → Understand → Inspect/Audit
- normal educator UI hides internal IDs
- context-sensitive help through stable Help_Key / UI Help Content Repository
- Educator Kit is downstream of accepted recommendation
- one primary teaching approach + up to two materially distinct alternatives
- failed Kit validation cannot appear ready
- Kit view/export must use persisted immutable EducatorKitSnapshot
- V1 export: PDF only
- repository Administration remains read-only/static/prototype; no canonical repository mutation/publication/rollback in V1

UI inspiration:
- Apple: restraint, whitespace, hierarchy
- Brilliant.org: guided flow and progressive disclosure
- Our World in Data ETL/DAG: inspectable dependency/graph interaction
- arcmodel.io: KG canvas/entity/relationship exploration

## 7. 27 Sep 2026 controlled operational/UI extension

The Bolt trial now explicitly includes the following V1 operational/UI additions without reopening recommendation semantics:

### Application Help
Keep existing context-sensitive Help_Key-based help and add a Help Center with:
- Getting Started / Navigation
- feature guide
- Create Recommendation
- Application Context
- Teaching Context
- Recommendation Result / Why this recommendation?
- Educator Kit
- Save for Later / My History
- Knowledge Graph Explorer
- Administration for authorised users
- data/privacy basics
- troubleshooting

Help content is not Recommendation Core evidence.

### Authentication and roles
Implement:
- EDUCATOR
- ADMIN

Personalized/persistent features and Administration require authenticated access. Protect Admin at the trusted service/data boundary, not just by hidden navigation.

### Basic User Management
Protected Admin may view users and manage role/status/access. Passwords remain with the auth provider and are never visible/stored by the app.

This is operational-security management only; it does not permit canonical repository mutation.

### Runtime repository database
The Bolt implementation should validate/import canonical/runtime repository files into a versioned persistent runtime database/store for efficient queries.

Canonical workbooks/CSVs remain source/release authority.

Runtime repository tables are read-only mirrors to the normal app and must be logically separate from operational tables.

Preserve IDs/relationships/version/source hashes. Recommendation events must capture the repository release/version used.

### Recommendation history
Every valid recommendation execution/abstention persists the appropriate immutable RecommendationContextSnapshot and RecommendationEvent associated with the authenticated user.

Add My History. It reads persisted results and must not silently recompute.

### Save for Later
The frozen Stage-F decision set already includes `SAVE_FOR_LATER`.

Saving persists an EducatorDecision linked to the user and immutable recommendation/Kit. A lightweight bookmark table may support current saved/unsaved state but does not replace the audit decision.

### Navigation
Recommended:
Home | Create Recommendation | My History | Knowledge Graph | Help
Administration only for authorised admins.

### Published review
After implementation, Bolt should provide a reviewable preview/published URL where supported, first-admin/test-user setup instructions, visible build/version information, and an APPLICATION_REVIEW_CHECKLIST.md.

## 8. Repository/source package status

The latest Bolt package is:

`Align_To_SDG_Bolt_Trial_Package_v1.2.zip`

It is built directly from the verified v1.1 package, not from the earlier v1.0 package.

v1.1 already contained the seven previously missing canonical governance/Stage-F workbooks:
1. System_Component_Artifact_Register_v0.3.xlsx
2. SCR_Framework_Mapping_Lean_v0.6_Complete_FullCF_FROZEN.xlsx
3. SCR_Pedagogical_Repository_Lean_v1.0_FROZEN.xlsx
4. Template_Output_Element_Contract_Repository_Lean_v0.2_FROZEN.xlsx
5. Framework_Context_Resolver_Repository_All295_v0.2_FROZEN.xlsx
6. Teaching_Case_Evidence_Repository_Lean_v0.2_OutputContract_Aligned.xlsx
7. StageF_F0_Educator_Kit_Design_v1.0_FROZEN.xlsx

Do not reconstruct these from summaries.

The package also contains the 19 validated runtime CSV files, frozen Design-8a reference implementation/Colab kit, current design specifications, Stage-F sources, validation evidence, UI wireframes/reference guidance, and historical rationale.

## 9. Bolt trial quality gates

v1.2 uses 12 gates:
QG-01 Repository integrity
QG-02 Contract integrity
QG-03 Graph integrity
QG-04 Semantic engine integrity
QG-05 Design-8a parity
QG-06 Educator input regression
QG-07 Negation/safety
QG-08 UI contract fidelity
QG-09 Educator Kit contract fidelity
QG-10 Application quality
QG-11 Authentication/user ownership/history/saved-state integrity
QG-12 Help/published review readiness

A good-looking app is not equivalent unless parity gates pass.

## 10. Immediate next workflow

For the Bolt experiment:
- upload/unpack `Align_To_SDG_Bolt_Trial_Package_v1.2.zip`
- paste `00_START_HERE/BOLT_MASTER_PROMPT_Align_To_SDG_v1.2.md`
- instruct Bolt to read all `00_START_HERE` material before coding
- build the complete application in one coordinated attempt
- permit alternate implementation technologies but preserve architecture/logic/data authority
- require all 12 quality gates, tests, technology decision log, parity report, database/import report, auth/user-management notes, and application review checklist

For the main production/research path:
- continue the Python/Streamlit/NetworkX/MiniLM implementation after the Bolt experiment is evaluated
- do not silently port Bolt implementation choices back into the authoritative path without review

## 11. Version-control rule

Do not regress to `Align_To_SDG_Bolt_Trial_Package_v1.0.zip`.

v1.1 was the correct prior baseline.

v1.2 is the current package after the 27 Sep 2026 operational/UI updates.
