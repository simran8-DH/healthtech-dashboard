# Self-Assessment

## Architecture choices

I built a classic **SPA + REST + relational DB** split because it matches the assignment’s suggested stack (React, Express, PostgreSQL) and keeps concerns clear: the UI owns workflow/UX, the API owns authz and validation, Postgres owns durable clinical facts and audit history.

**Prisma** was chosen over raw SQL or a heavier ORM so the schema (User, Patient, Encounter, AuditLog) stays documented in one file and migrations are reproducible for Docker demos.

## Trade-offs

| Decision | Trade-off |
|----------|-----------|
| JWT in `localStorage` | Simple for SPA demos; slightly more XSS-sensitive than httpOnly cookies |
| Polling (20–30s) instead of WebSockets | Easier ops for assignment; not true sub-second real-time |
| Anonymized codes only | Strong privacy posture; harder for clinicians who know patients by name in the room (would need a separate offline identity map outside this system) |
| Admin cannot create encounters | Matches “analyze trends” brief; some clinics may want admins to backfill data |
| Single-region Compose deploy | Fine for coursework; production needs managed secrets, TLS, backups, HA |

## UX decisions

- **Teal clinical theme** with clear role badge so staff know which permissions they have  
- **Demo account chips** on login for evaluators  
- **Session-expiry banner** when redirected with `?reason=expired`  
- **Field-level validation errors** for incomplete encounters  
- **Mobile sticky nav** so PHC tablet use remains workable  
- Nurses land on **Encounters** (their primary task); doctors/admins on **Dashboard**

## Edge cases handled

1. **Session expiry during data entry** — JWT verify returns `TOKEN_EXPIRED`; Axios interceptor clears storage and routes to login with a warning.  
2. **Invalid / incomplete encounter data** — Zod rejects empty symptoms/diagnosis, missing patient, invalid category/severity; UI lists field errors.  
3. **Role access violations** — `authorize()` middleware returns 403 and writes `ACCESS_DENIED` audit entries; frontend route guards hide unauthorized pages.  
4. **Anonymized code collision** — rare retry loop when generating `PT-` codes.  

## Testing

`backend/tests/critical.test.js` covers validators, JWT expiry, anonymization format, and the documented RBAC matrix. Full HTTP integration tests can be added once CI has a Postgres service container.

## Potential improvements

- Refresh tokens + sliding sessions to reduce mid-form logouts  
- WebSocket/SSE push for live multi-nurse clinics  
- Soft-delete + encounter versioning for medico-legal review  
- FHIR R4 export for state health exchanges  
- Hindi / regional language UI strings for rural staff  
- Rate limiting and CAPTCHA on login for internet-exposed deployments  
- Automated E2E (Playwright) for nurse create → doctor edit → admin chart flows  

## What I would do differently with more time

Add Cloud Run / Render one-click deploy with managed Postgres, OpenAPI-generated client types, and a small “offline draft” queue in IndexedDB so flaky rural connectivity does not lose encounter forms.
