# Controlled V1 Extension — 2026-09-27

## Status
Approved for the Bolt alternate-technology trial. These are operational/UI additions and do not reopen Design-8a recommendation semantics or canonical repository authority.

## Decisions

### 1. Context-sensitive help
Already part of the frozen/current UI design and package through `UI_Help_Content_Repository_v0.3.xlsx`. Bolt must wire stable Help_Key-based contextual help into the application.

### 2. Application Help / Help Center
Add an in-app Help surface covering:
- Getting Started and navigation;
- Create a Recommendation;
- Application Context;
- Teaching Context;
- Recommendation Result and Why this recommendation?;
- Educator Kit;
- Save for Later and My History;
- Knowledge Graph Explorer;
- Administration for authorised users;
- data/privacy basics;
- troubleshooting.

This Help content is UI/application content and cannot become Recommendation Core evidence.

### 3. Runtime repository database
Import validated canonical/runtime repository content into a persistent runtime database/store for application use. Source workbooks/CSVs remain authoritative release sources. Runtime tables are read-only mirrors to normal application users/admins.

Keep canonical/runtime repository tables logically separate from operational tables.

### 4. Authentication and roles
Implement:
- EDUCATOR
- ADMIN

Protect personalized/persistent features and Admin. Enforce roles at the trusted service/data boundary, not only in navigation.

### 5. Basic User Management
Admin may view users and manage role/status/access. This is an operational-security capability and does not permit canonical repository authoring/publication.

### 6. My History
Associate recommendation events/context snapshots/Kits with the authenticated user. Show the user's own persisted recommendation history without rerunning the recommendation engine.

### 7. Save for Later
The existing governed educator action `SAVE_FOR_LATER` must persist as `EducatorDecision`. A lightweight bookmark table may support current saved/unsaved UI state but may not replace the audit decision or affect recommendation semantics.

### 8. Published review
After the build, provide a reviewable preview/published URL when supported, application version/build identity, first-admin/test-user setup instructions, and `APPLICATION_REVIEW_CHECKLIST.md`.

## Quality-gate additions
- QG-11 Authentication, User Ownership, History, and Saved-State Integrity.
- QG-12 Help and Published Review Readiness.
