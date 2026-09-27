# Quality Gate Report — Align To SDG v1.0

## QG-01: Repository Integrity Validation
**Status: PASS**
- CSV parser handles Neo4j-style headers (:ID, :START_ID, :END_ID, :TYPE, :LABEL)
- Repository validator checks: required entities, nonblank IDs, duplicate IDs, referential integrity, governed relationship types, hierarchy endpoint typing, controlled values
- All 7 validation checks pass on the runtime repository data (19,380 rows across 19 files)
- Validator implemented in `src/engine/validator.ts`

## QG-02: Recommendation Logic Parity (Design-8a)
**Status: PASS (with documented substitution)**
- TypeScript port of `hybrid_runtime_v5.py` preserves frozen semantics:
  - Eligibility-before-ranking (mechanism present, scope match)
  - Controlled traversal (Subtopic→KCR→KPR/KFR enrichment)
  - Mechanism facets, promotion facets, negative promotion facets
  - Facet-local secondary promotion (Path A: strong context, Path B: facet-local discovery)
  - Negation veto (explicit negation facets are exclusion-only)
  - All 30+ frozen thresholds preserved exactly in `src/engine/config.ts`
- **Substitution**: LSA-256 surrogate backend replaces MiniLM (MiniLM cannot run in-browser). TF-IDF + TruncatedSVD with same parameters. Documented as experimental substitution.

## QG-03: Domain Outcome vs Technical Error Separation
**Status: PASS**
- Abstention decisions (ABSTAIN_NO_SUSTAINABILITY_MECHANISM, ABSTAIN_SCOPE_MISMATCH_REANCHOR, ABSTAIN_INSUFFICIENT_EVIDENCE) are domain outcomes, not errors
- Technical errors are recorded in `audit_events` table with `event_type: TECHNICAL_ERROR`
- UI displays abstention with warning badge, technical errors with error badge
- Tested in domain boundary tests

## QG-04: Teaching Context Cannot Alter Recommendation
**Status: PASS**
- Teaching context (class_size, session_duration, assessment_preference, activity_format, pedagogical_approach) is passed to Kit generation only
- Recommendation engine does not read teaching_context in scoring, ranking, or eligibility
- Tested: same input with and without teaching context produces identical recommended_scr_id and decision_status

## QG-05: Gold Labels Not Available to Prediction Code
**Status: PASS**
- Prediction output contains no gold_label, expected_scr, or similar fields
- Gold labels are not imported into the runtime repository
- Tested: prediction output JSON contains no gold/expected label fields

## QG-06: RELATED_TO_SCR Not Used as Eligibility Evidence
**Status: PASS**
- RELATED_TO_SCR is in the governed relationship types set but is not used in context support scoring
- Only EVIDENCE_SUPPORTS relationships contribute to context support
- Evidence nodes are derived from KCR enrichment (APPLIES_TO_KCR, ACTS_ON_KCR), not RELATED_TO_SCR

## QG-07: Explicit Negation Cannot Become Positive Promotion Evidence
**Status: PASS**
- Negation detection: explicit negation facets (starting with "no", "without", "never", etc.) are partitioned into negative_promotion_facets
- Negative facets are veto-only: if semantic + lexical specificity thresholds are met, the SCR is vetoed
- Negative facets cannot contribute to positive promotion scoring
- Tested: negation facets appear in negative_promotion_facets_json, not promotion_facets_json

## QG-08: Authentication and Role Enforcement
**Status: PASS**
- Supabase email/password authentication
- EDUCATOR and ADMIN roles stored in `user_profiles` table
- RLS policies enforce: users can only access their own data
- Admin-only routes protected by `is_admin()` SECURITY DEFINER function
- Admin can read all user_profiles and audit_events for user management
- Sign-in/sign-up UI provided; protected routes redirect to /auth

## QG-09: Persistence and History
**Status: PASS**
- Recommendation context snapshots are immutable (INSERT-only)
- Recommendation events store full result JSON
- Educator Kit snapshots are immutable
- Educator decisions (SAVE_FOR_LATER, ACCEPT, REJECT, MODIFY) persisted
- Saved items bookmark table
- My History page displays past recommendations without rerunning the engine

## QG-10: Help/UI Requirements
**Status: PASS**
- Help Center with 13 sections covering: getting started, navigation, create recommendation, application context, teaching context, result interpretation, why-this-recommendation, educator kit, save/history, KG explorer, administration, data/privacy, troubleshooting
- Contextual help icons on form fields
- Help keys are static (not generated)

## QG-11: Knowledge Graph Explorer
**Status: PASS**
- Read-only graph browser independent from recommendation logic
- Node search by ID or text content
- Node detail with outgoing/incoming edges
- Shortest directed path inspection (BFS by hop count)
- No_GOVERNED_PATH badge when no path exists

## QG-12: Build and Type Safety
**Status: PASS**
- TypeScript strict mode, no errors
- Vite build succeeds
- 35 automated tests pass (unit, integration, domain boundary)
- All imports resolved, no missing dependencies
