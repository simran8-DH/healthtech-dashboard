# HealthTech Patient Data Dashboard

Assignment app for rural telemedicine: anonymized patient visits, RBAC, and health-trend charts.

**Code repo:** https://github.com/simran8-DH/healthtech-dashboard  
**GitHub Pages (UI only):** https://simran8-dh.github.io/healthtech-dashboard/  
**Full working stack on your PC (Docker):** http://localhost:8080  

---

## Do not remove Prisma

**Prisma is required.** It is the ORM between Express (Node) and PostgreSQL.

| Without Prisma | With Prisma |
|----------------|-------------|
| Hand-written SQL everywhere | Models in `backend/prisma/schema.prisma` |
| Manual table create scripts | Migrations in `backend/prisma/migrations/` |
| Easy to break queries | Type-safe `prisma.patient.create(...)` etc. |

`_prisma_migrations` table = Prisma’s log of applied schema changes. Not clinic data. Ignore in demos.

---

## What each Docker container does

```bash
docker compose up --build -d
```

| Container | Image / build | Port | Responsibility |
|-----------|---------------|------|----------------|
| **`db`** | `postgres:16-alpine` | `5432` | **Database.** Stores all persistent data: staff (`users`), anonymized `patients`, clinical `encounters`, and `audit_logs`. Data survives restarts via the `pgdata` volume. |
| **`api`** | Built from `backend/Dockerfile` | internal `4000` (not published) | **Backend.** Node.js + Express REST API. Handles login (JWT), role checks (NURSE/DOCTOR/ADMIN), Zod validation, Prisma queries to Postgres, and dashboard aggregations. |
| **`web`** | Built from `frontend/Dockerfile` (Nginx) | **`8080`** | **Frontend.** Serves the React app. Nginx also reverse-proxies `/api/*` to the `api` container so the browser talks to one origin (`localhost:8080`). |

**Open the app:** http://localhost:8080  

**How traffic flows:** Browser → `web` (Nginx on `:8080`) → static React files; any path under `/api` is proxied to the `api` container.

### All APIs (base: `http://localhost:8080/api`)

Protected routes need header: `Authorization: Bearer <jwt>`

| Method | Path | Who | What it does |
|--------|------|-----|----------------|
| `GET` | `/health` | Public | Health check — confirms API is up |
| `GET` | `/` (API root via `/` on api) | Public | Service info (when hitting API directly) |
| `POST` | `/auth/login` | Public | Logs in staff; returns JWT + user role |
| `GET` | `/auth/me` | Any logged-in | Returns current user profile |
| `POST` | `/auth/register` | **ADMIN** | Creates a new staff account (nurse/doctor/admin) |
| `GET` | `/auth/users` | **ADMIN** | Lists all clinic users |
| `POST` | `/patients` | NURSE, DOCTOR, ADMIN | Creates anonymized patient (`PT-…` code) |
| `GET` | `/patients` | NURSE, DOCTOR, ADMIN | Lists/search patients (registry) |
| `GET` | `/patients/:id` | NURSE, DOCTOR, ADMIN | One patient + their visit history |
| `POST` | `/encounters` | NURSE, DOCTOR | Creates a clinical visit (optionally creates patient too) |
| `GET` | `/encounters` | NURSE, DOCTOR, ADMIN | Lists visits (filter by category/date/etc.) |
| `GET` | `/encounters/:id` | NURSE, DOCTOR, ADMIN | One visit detail |
| `PUT` | `/encounters/:id` | **DOCTOR** | Updates diagnosis/treatment/etc. |
| `DELETE` | `/encounters/:id` | DOCTOR, ADMIN | Deletes a visit |
| `GET` | `/dashboard/metrics` | DOCTOR, ADMIN | Charts data: totals, categories, severity, age, trend |
| `GET` | `/dashboard/audit-logs` | **ADMIN** | Security trail (logins, CRUD, access denied) |

**Inspect tables:**

```bash
docker exec -it healthtechdashboard-db-1 psql -U healthtech -d healthtech_db
```

Then `\dt`, `SELECT * FROM patients;`, `\q`.

---

## Where is it hosted?

| What | Where |
|------|--------|
| Code | GitHub |
| UI (public) | https://simran8-dh.github.io/healthtech-dashboard/ |
| Full app | Docker → http://localhost:8080 |

Public Pages login needs a Cloudflare tunnel — see [docs/DEPLOY.md](docs/DEPLOY.md).  
Easiest interview demo: screen-share **http://localhost:8080**.

---

## Tech stack (what you used)

| Layer | Tech | Why |
|-------|------|-----|
| Frontend | React + Vite | SPA forms, routing, charts |
| Charts | Recharts | Dashboard trends |
| HTTP client | Axios | API calls + JWT header + session expiry redirect |
| Backend | Node.js + Express | REST CRUD |
| ORM | **Prisma** | Schema, migrations, queries |
| DB | PostgreSQL | Relational data + aggregations |
| Auth | JWT + bcrypt | Stateless login, hashed passwords |
| Validation | Zod | Reject incomplete encounter data |
| Containers | Docker Compose | One-command run of all services |
| Hosting (UI) | GitHub Pages | Free static hosting from `main` |

---

## Roles (say this clearly)

| Role | Can do | Cannot |
|------|--------|--------|
| Nurse | Create visits + anonymized patients; view lists | Dashboard, edit/delete, audit |
| Doctor | Everything nurse can + edit/delete + **Dashboard** | Audit logs |
| Admin | **Dashboard** + **Audit logs** + view data | Enter clinical visits (by design) |

---

## Database tables (business)

| Table | Meaning |
|-------|---------|
| `users` | Staff accounts + roles |
| `patients` | Anonymized codes (`PT-…`), age, gender, location |
| `encounters` | Visits: symptoms → diagnosis → treatment |
| `audit_logs` | Security trail |
| `_prisma_migrations` | Prisma internal only |

---

## Run locally (correct way)

```bash
docker compose up --build -d
```

- App: http://localhost:8080  

Demo logins: `nurse@` / `Nurse@123`, `doctor@` / `Doctor@123`, `admin@` / `Admin@123` (all `@healthtech.local`).

---

## Likely interview questions

1. **Why Prisma?** — ORM: schema as code, migrations, safer queries than raw SQL.  
2. **Why PostgreSQL not MongoDB?** — Relational links (user→encounter→patient), aggregations for dashboard.  
3. **How is RBAC done?** — JWT carries `role`; Express `authorize()` middleware on routes; UI hides screens.  
4. **How is privacy handled?** — No names/phones; `PT-` codes; age group + location code only.  
5. **What is an encounter vs patient?** — Patient = who; Encounter = one visit.  
6. **How do you secure passwords?** — bcrypt hash (cost 12); never store plain text.  
7. **Session expiry?** — JWT expires (8h); API returns `TOKEN_EXPIRED`; frontend sends user to login.  
8. **What does Docker give you?** — Same stack everywhere; DB+API+UI with one command.  
9. **GitHub Pages limitation?** — Static files only; cannot run Express or Postgres on Pages.  
10. **How does Dashboard get numbers?** — `GET /api/dashboard/metrics` with date range; Prisma counts + SQL trend.

---

## Docs

- [Architecture](docs/ARCHITECTURE.md)  
- [API](docs/API.md)  
- [User / roles guide](docs/USER_GUIDE.md)  
- [Self-assessment](docs/SELF_ASSESSMENT.md)  
