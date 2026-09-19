# REST API Reference

**Base URL (Docker):** `http://localhost:8080/api`  
Nginx on `web` proxies `/api` → `api` container.

All protected routes need:

```
Authorization: Bearer <jwt>
```

Response shape: `{ success: true, data: ... }` or `{ success: false, message, code, errors? }`.

---

## System

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | Public | Liveness probe — API is running |

---

## Auth — `/api/auth`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `POST` | `/auth/login` | Public | Email/password → JWT + user (role, name) |
| `GET` | `/auth/me` | Any logged-in | Current user profile |
| `POST` | `/auth/register` | **ADMIN** | Create staff account (`NURSE` / `DOCTOR` / `ADMIN`) |
| `GET` | `/auth/users` | **ADMIN** | List all users |

**Login body:** `{ "email": string, "password": string }`

---

## Patients — `/api/patients`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `POST` | `/patients` | NURSE, DOCTOR, ADMIN | Create anonymized patient (`PT-XXXXXX`) |
| `GET` | `/patients` | NURSE, DOCTOR, ADMIN | List/search patients (`?search=&page=&limit=`) |
| `GET` | `/patients/:id` | NURSE, DOCTOR, ADMIN | Patient detail + encounter history |

**Create body:** `{ "ageGroup", "gender?", "villageCode?" }`

---

## Encounters (visits) — `/api/encounters`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `POST` | `/encounters` | NURSE, DOCTOR | Create visit; can include `newPatient` or `patientId` |
| `GET` | `/encounters` | NURSE, DOCTOR, ADMIN | List visits (`?category=&startDate=&endDate=&page=`) |
| `GET` | `/encounters/:id` | NURSE, DOCTOR, ADMIN | Single visit |
| `PUT` | `/encounters/:id` | **DOCTOR** | Update clinical fields |
| `DELETE` | `/encounters/:id` | DOCTOR, ADMIN | Delete visit |

**Create body (example):**
```json
{
  "newPatient": { "ageGroup": "18-40", "gender": "FEMALE", "villageCode": "ULHASNAGAR" },
  "encounterDate": "2026-09-19T10:00:00.000Z",
  "symptoms": "...",
  "diagnosis": "...",
  "treatment": "...",
  "category": "viral",
  "severity": "mild",
  "followUpNeeded": false,
  "notes": "optional"
}
```

---

## Dashboard — `/api/dashboard`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/dashboard/metrics` | DOCTOR, ADMIN | Totals + charts (`?startDate=&endDate=&category=`) |
| `GET` | `/dashboard/audit-logs` | **ADMIN** | Audit trail (`?limit=`) |

---

## Error codes

| Code | Meaning |
|------|---------|
| `UNAUTHORIZED` | Missing/invalid auth |
| `TOKEN_EXPIRED` | Session expired mid-entry |
| `FORBIDDEN` | Role access violation |
| `VALIDATION_ERROR` | Invalid/incomplete payload |
| `NOT_FOUND` | Missing resource |
| `INVALID_CREDENTIALS` | Bad login |
