# System Architecture

## High-level diagram

```
┌─────────────────┐     HTTPS/JSON      ┌──────────────────────┐
│  React SPA      │ ◄─────────────────► │  Express API         │
│  (Vite build)   │   Bearer JWT        │  /api/*              │
│  Nginx (prod)   │                     │  Helmet, CORS, Zod   │
└─────────────────┘                     └──────────┬───────────┘
                                                   │
                                                   │ Prisma ORM
                                                   ▼
                                        ┌──────────────────────┐
                                        │  PostgreSQL          │
                                        │  users, patients,    │
                                        │  encounters,         │
                                        │  audit_logs          │
                                        └──────────────────────┘

Optional cloud: AWS ECS/Fargate or GCP Cloud Run + managed Postgres (RDS / Cloud SQL)
```

### Request flow (example: create encounter)

1. Nurse authenticates → `POST /api/auth/login` → JWT issued  
2. Nurse submits form → `POST /api/encounters` with `Authorization: Bearer …`  
3. Middleware verifies JWT + role ∈ {NURSE, DOCTOR}  
4. Zod validates body; incomplete data rejected with field errors  
5. Prisma creates Patient (if needed) + Encounter  
6. AuditLog row written (`CREATE` / `Encounter`)  
7. UI navigates to detail; list/dashboard auto-refresh picks up the record  

## Tech stack justification

| Choice | Why |
|--------|-----|
| **React** | Component model fits forms + charts; large hiring pool; Vite gives fast local DX |
| **Express** | Lightweight REST API, easy JWT middleware, aligns with common Node curricula |
| **PostgreSQL** | Relational integrity for users↔encounters, strong aggregations for dashboards, ACID |
| **Prisma** | Type-safe schema, migrations, seed scripts — faster than raw SQL for this scope |
| **JWT** | Stateless auth suitable for SPA + API split; works behind load balancers |
| **Docker Compose** | One-command local/prod-like stack for assignment demos and CI |

## Security & data protection

Aligned with privacy-by-design for health-adjacent data (not a substitute for full DPDP Act / HIPAA compliance, but assignment-appropriate controls):

1. **Minimization** — no names, phones, addresses, or national IDs; anonymized codes only  
2. **Access control** — role checks on every mutating and analytics route; denials audited  
3. **Transport** — HTTPS expected in cloud; Helmet sets secure HTTP headers  
4. **Secrets** — passwords bcrypt (cost 12); JWT secret via env; `.env` not committed for prod  
5. **Validation** — Zod schemas block malformed / incomplete payloads  
6. **Session expiry** — JWT `8h`; expired token returns `TOKEN_EXPIRED`; frontend redirects to login with a clear message so clinicians know to re-authenticate  
7. **Auditability** — `AuditLog` for login success/failure, CRUD, access denied  

## Scalability

- **Horizontal API scale**: stateless Express + JWT → multiple replicas behind a load balancer  
- **DB scale**: Postgres read replicas for dashboard aggregations; indexes on `encounter_date`, `category`, `patient_id`  
- **Frontend CDN**: static React assets on S3+CloudFront / Cloud Storage  
- **Future**: Redis for rate limiting; WebSockets/SSE for true push updates; partition encounters by month for large PHC networks  

## Integrations (extensible)

- SMS gateway for follow-up reminders (using patient code + clinic contact, never PII in this DB)  
- State telemedicine platforms via FHIR-lite export of anonymized encounters  
- Object storage for optional clinical attachments (out of current scope)  
