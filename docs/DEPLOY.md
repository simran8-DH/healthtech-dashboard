# Permanent hosting (no tunnel) — ~10 minutes

Goal: GitHub Pages UI + cloud API + cloud DB. Tunnel never needed again.

## 1) Neon (free database) — 2 min

1. Open https://console.neon.tech → sign up / login (GitHub OK)
2. **Create project** → name `healthtech`
3. Copy **Connection string** (starts with `postgresql://...`)
4. Keep it for step 2

## 2) Render (free API) — 5 min

1. Open https://dashboard.render.com → login with **GitHub**
2. **New** → **Web Service**
3. Connect repo: `simran8-DH/healthtech-dashboard`
4. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Docker
   - **Instance:** Free
5. Environment variables:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | (paste Neon string) |
| `JWT_SECRET` | any long random text |
| `FRONTEND_URL` | `https://simran8-dh.github.io` |
| `NODE_ENV` | `production` |
| `SEED_SAMPLES` | `false` |

6. **Create Web Service** → wait until status is **Live**
7. Copy your service URL, e.g. `https://healthtech-api-xxxx.onrender.com`

## 3) Point GitHub Pages at Render (once)

1. Repo → **Settings** → **Secrets and variables** → **Actions** → **Variables**
2. `VITE_API_URL` = `https://YOUR-RENDER-URL.onrender.com/api`
3. **Actions** → **Deploy to GitHub Pages** → **Run workflow**
4. Wait ~1 min → Ctrl+F5 → login

Done. No tunnel. Docker stays only for local work (`localhost:8080`).

## Demo logins (seeded on first API boot)

- nurse@healthtech.local / Nurse@123  
- doctor@healthtech.local / Doctor@123  
- admin@healthtech.local / Admin@123  

**Note:** Free Render sleeps after idle; first request may take 30–60s.
