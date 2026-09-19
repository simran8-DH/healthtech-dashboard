# User Guide — roles & screens

Local app: **http://localhost:8080**  
Health check: **http://localhost:8080/api/health**

In the app, open **Roles guide** in the sidebar for the same content.

---

## Nurse (`nurse@healthtech.local` / `Nurse@123`)

**Job:** Enter patient visits in real time at the clinic desk.

| Screen | What it does |
|--------|----------------|
| **Visits** | List of clinical encounters (date, diagnosis, treatment) |
| **+ New visit** | Form to create a visit. Choose *New anonymized patient* → system creates a `PT-…` code with age/gender/location (e.g. ULHASNAGAR) |
| **Patients** | Registry of people only (who) — not clinical notes |
| **Roles guide** | This explanation |

**Cannot:** edit/delete visits, open Dashboard, open Audit logs.

---

## Doctor (`doctor@healthtech.local` / `Doctor@123`)

**Job:** Review nurse data, correct clinical details, watch health trends.

| Screen | What it does |
|--------|----------------|
| **Dashboard** | Charts: totals, viral/seasonal/diabetes categories, severity, age groups, daily trend. Filter by dates |
| **Visits** | Same list as nurse + **Edit** and **Delete** |
| **+ New visit** | Can also enter visits |
| **Patients** | Anonymized profiles + visit history |

**Cannot:** Audit logs, register staff.

---

## Admin (`admin@healthtech.local` / `Admin@123`)

**Job:** Oversight and security — not front-line clinical entry.

| Screen | What it does |
|--------|----------------|
| **Dashboard** | Same analytics as doctor — planning for the catchment area |
| **Audit logs** | Who logged in, who created/updated/deleted, who was blocked (ACCESS_DENIED) |
| **Visits / Patients** | Read clinic activity; can delete bad visits |

**Cannot:** create or edit visits from the UI (nurses/doctors own clinical data).

---

## Glossary

- **Patients** = who (anonymized code + demographics)  
- **Visits** = what happened (symptoms → treatment)  
- **Dashboard** = trends for decisions  
- **Audit logs** = security trail for admins  

---

## View tables (`psql` in the `db` container)

```bash
docker exec -it healthtechdashboard-db-1 psql -U healthtech -d healthtech_db
```

Useful commands:

```sql
\dt
SELECT * FROM patients;
SELECT * FROM encounters;
\q
```
