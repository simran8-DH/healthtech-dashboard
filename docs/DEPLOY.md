# Deploy notes (optional)

## Current setup

- **Code:** GitHub  
- **UI (public):** GitHub Pages  
- **Full app:** Docker on localhost:8080  

## Optional later (permanent cloud API)

GitHub Pages cannot run Express/Postgres. For a 24/7 public API:

1. Neon (free Postgres) → `DATABASE_URL`  
2. Render (free Node/Docker) → deploy `backend/`  
3. Repo Action variable `VITE_API_URL` = `https://YOUR-API.onrender.com/api`  
4. Re-run GitHub Pages workflow  

Not required for local/Docker demos.
