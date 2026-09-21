# Public demo with GitHub Pages + tunnel (simple)

## Everyday local use (no tunnel)

```powershell
cd "C:\Users\Lenovo\Desktop\projects\HealthTech Dashboard"
docker compose up -d
```

Open: **http://localhost:8080**

---

## Send GitHub Pages link to someone (needs tunnel)

### 1) Start Docker
```powershell
cd "C:\Users\Lenovo\Desktop\projects\HealthTech Dashboard"
docker compose up -d
```

### 2) Start tunnel (leave this window open)
```powershell
npx cloudflared tunnel --url http://localhost:8080
```

Copy the URL it prints, e.g. `https://something.trycloudflare.com`

### 3) Point Pages at that URL (only if URL changed)
1. https://github.com/simran8-DH/healthtech-dashboard/settings/variables/actions  
2. Variable `VITE_API_URL` = `https://something.trycloudflare.com/api`  
3. Actions → **Deploy to GitHub Pages** → **Run workflow**  
4. Wait ~1 minute → Ctrl+F5

### 4) Share
https://simran8-dh.github.io/healthtech-dashboard/

Demo logins: `nurse@healthtech.local` / `Nurse@123` (also doctor@ / admin@ with Doctor@123 / Admin@123)
