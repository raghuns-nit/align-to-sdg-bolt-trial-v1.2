# Application Review Checklist — Align To SDG v1.0

## Build Information
- **Version**: 1.0.0
- **Framework**: React 18 + Vite 5 + TypeScript 5
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Build**: `npx vite build` — succeeds, all assets generated
- **Tests**: 35/35 passing (4 test suites)
- **TypeScript**: Strict mode, 0 errors

## Technology Decision Log
| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Frontend framework | React 18 | Bolt standard, component model fits UI requirements |
| Build tool | Vite 5 | Bolt standard, fast HMR, ?raw imports for CSV data |
| Language | TypeScript 5 | Type safety for complex recommendation engine |
| Database | Supabase (PostgreSQL) | Bolt standard, RLS, auth, edge functions |
| Auth | Supabase email/password | Spec requirement, no magic links |
| Graph engine | Custom adjacency-list BFS | No external graph DB needed; controlled traversal semantics |
| Semantic backend | LSA-256 (TF-IDF + SVD) | MiniLM cannot run in-browser; LSA is the documented surrogate |
| Graph visualization | HTML/CSS list view | Cytoscape available but not needed for read-only inspection |
| Icons | lucide-react | Lightweight, tree-shakeable |
| Routing | react-router-dom 6 | Standard SPA routing |

## Authentication Implementation
- Supabase email/password auth with `onAuthStateChange` (deadlock-safe pattern)
- `user_profiles` table with role (EDUCATOR/ADMIN) and status (ACTIVE/INACTIVE)
- `is_admin()` SECURITY DEFINER function for admin-only policies
- RLS: users can only access own data; admin can read all profiles/audit
- Sign-in and sign-up UI provided

## Persistence Implementation
- `recommendation_context_snapshots`: immutable request state
- `recommendation_events`: recommendation execution results
- `educator_kit_snapshots`: immutable Kit content with validation status
- `educator_decisions`: SAVE_FOR_LATER, ACCEPT, REJECT, MODIFY
- `saved_items`: lightweight bookmarks
- `audit_events`: technical error audit trail
- All operational tables have RLS with user_id ownership checks

## Implementation Deviations
1. **LSA surrogate for MiniLM**: The frozen Design-8a reference uses `sentence-transformers/all-MiniLM-L6-v2` which cannot run in a browser environment. We substitute an LSA-256 backend (TF-IDF + TruncatedSVD) with the same parameters. This is documented as an experimental substitution. The semantic backend interface is pluggable — a MiniLM backend could be added via an edge function proxy.
2. **Repository data loading**: Runtime repository data is loaded from local CSV files bundled at build time (via Vite `?raw` imports) rather than from Supabase tables. This is because the 19K-row import would require service-role access not available in the browser. The Supabase tables exist and are populated with SDG goals, ESD competencies, and CF competencies; the import-repository edge function is deployed for server-side import.
3. **KGR (Guardrail) enforcement**: Guardrail data is loaded and validated but not actively enforced in the recommendation engine. The Python reference also does not enforce guardrails in the predict() method — they are a validation-layer concern.
4. **Kit templates**: A single default template is used rather than per-SCR templates from the Stage-F workbooks. The workbook binary format (XLSX) could not be parsed in-browser.

## Unresolved Parity Issues
1. **SVD implementation**: The power-iteration SVD is a simplified approximation of scikit-learn's TruncatedSVD. Results will differ numerically from the Python reference. The semantic interface and ranking logic are identical; only the embedding values differ.
2. **Full Supabase repository import**: Only 3 small tables (SDG goals, ESD competencies, CF competencies) were imported to Supabase. The remaining 16K+ rows are loaded from local CSVs. A server-side import script (edge function) is deployed but requires admin authentication to run.

## Supported Requirements
- All 12 quality gates: PASS
- Design-8a frozen semantics preserved
- Eligibility-before-ranking
- Controlled traversal
- Facet-local secondary promotion
- Negation veto
- Domain outcome / technical error separation
- Teaching context isolation
- Gold label isolation
- RELATED_TO_SCR exclusion from eligibility
- Authentication with EDUCATOR/ADMIN roles
- Immutable persistence and history
- Help center with 13 sections
- Knowledge Graph Explorer (read-only, path inspection)
- Educator Kit generation and validation
- Save for Later
- Admin user management
