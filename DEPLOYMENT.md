# 🌙 Qurban Monitor — Deployment Guide

> **Stack**: Vercel (Frontend) · Render (Backend) · Supabase (PostgreSQL)
> All services run on **free tiers**.

---

## Overview

```
Browser → Vercel (React SPA)
              ↕ HTTPS API calls
         Render (Node.js + Express)
              ↕ SSL/PostgreSQL
         Supabase (PostgreSQL)
```

---

## Step 1 — Set Up Supabase Database

1. Go to **[supabase.com](https://supabase.com)** → New Project
2. Choose a **Project name** (e.g. `qurban-db`) and set a strong password
3. Select the region **closest to your users** (e.g. Southeast Asia)
4. Wait ~2 minutes for provisioning

### Get the Connection String

1. In your Supabase project: **Settings → Database**
2. Under **Connection string**, select **URI** tab
3. Choose **Transaction** mode (port `6543`) — required for serverless/Render
4. Copy the string:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres
   ```
5. Keep this — you'll paste it into Render in Step 2

### Configure Supabase for Production

Go to **Settings → Database → Connection Pooling**:
- Enable **PgBouncer**
- Mode: **Transaction**

---

## Step 2 — Deploy Backend to Render

### Option A: Auto-deploy via render.yaml (Recommended)

1. Push the **entire repo** to GitHub (make sure `render.yaml` is at root)
2. Go to **[render.com](https://render.com)** → Dashboard → **New Blueprint Instance**
3. Connect your GitHub repo
4. Render will detect `render.yaml` and configure the service automatically
5. Set the **secret environment variables** that are marked `sync: false`:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Supabase Transaction connection string |
| `JWT_SECRET` | Random string ≥ 64 chars ([generate here](https://1password.com/password-generator/)) |
| `JWT_REFRESH_SECRET` | Another random string ≥ 64 chars |
| `FRONTEND_URL` | Your Vercel URL (set after Step 3) |
| `WA_API_TOKEN` | Fonnte token (optional) |

### Option B: Manual Setup

1. Render Dashboard → **New Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Runtime**: Docker
   - **Docker Context**: `./backend`
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Plan**: Free
   - **Health Check Path**: `/api/health`
4. Add all environment variables from `.env.example`

### First Deploy

The Docker container will automatically run:
```
npm run migrate  →  npm start
```
This creates all 7 database tables on first boot.

### Seed Demo Data (Optional)

In Render Dashboard → your service → **Shell** tab:
```bash
npm run seed
```

> ⚠️ **Free tier note**: Render free services spin down after 15 minutes of inactivity.
> First request after spin-down takes ~30 seconds (cold start).
> The health check at `/api/health` will return a `503` during spin-up.

---

## Step 3 — Deploy Frontend to Vercel

### Quick Deploy

1. Push the `frontend/` folder to GitHub
2. Go to **[vercel.com](https://vercel.com)** → **New Project**
3. Import your GitHub repo
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Environment Variables in Vercel

In Vercel Dashboard → Project → **Settings → Environment Variables**:

| Key | Value | Environment |
|---|---|---|
| `VITE_API_URL` | `https://your-api.onrender.com/api` | Production |
| `VITE_API_URL` | `http://localhost:5000/api` | Development |

> Replace `your-api.onrender.com` with your actual Render service URL.

### Update Backend CORS

After Vercel deploys, copy your Vercel URL (e.g. `https://qurban-monitor.vercel.app`).

In Render Dashboard → your service → **Environment**:
- Set `FRONTEND_URL` = `https://qurban-monitor.vercel.app`
- Click **Save Changes** (this triggers a redeploy)

---

## Step 4 — Verify Deployment

### Health Check
```bash
curl https://your-api.onrender.com/api/health
```
Expected response:
```json
{
  "success": true,
  "service": "Qurban Monitoring System API",
  "database": { "status": "connected", "latency_ms": 45 }
}
```

### Test Login
1. Open your Vercel URL
2. Login as Admin: `08100000000` / `admin123`
3. Check that the dashboard loads data

---

## Environment Variables Reference

### Backend (Render)

| Variable | Required | Description |
|---|---|---|
| `PORT` | Auto | Set by Render (10000) |
| `NODE_ENV` | ✅ | `production` |
| `DATABASE_URL` | ✅ | Supabase connection string |
| `JWT_SECRET` | ✅ | Random 64+ char string |
| `JWT_REFRESH_SECRET` | ✅ | Random 64+ char string |
| `JWT_EXPIRES_IN` | ✅ | `7d` |
| `FRONTEND_URL` | ✅ | Your Vercel URL |
| `WA_ENABLED` | — | `false` (or `true` if Fonnte configured) |
| `WA_API_TOKEN` | — | Fonnte API token |

### Frontend (Vercel)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | `https://your-api.onrender.com/api` |

---

## Free Tier Limitations

| Service | Limit | Impact |
|---|---|---|
| Render | 750 hrs/mo, spins down after 15 min idle | ~30s cold start |
| Supabase | 500MB DB, 2 projects, 50MB file storage | Sufficient for qurban ops |
| Vercel | Unlimited deployments, 100GB bandwidth | No impact |

### Keeping Render Alive (Optional)

To prevent cold starts, use [UptimeRobot](https://uptimerobot.com) (free):
1. Create a new HTTP monitor
2. URL: `https://your-api.onrender.com/api/health`
3. Interval: every 5 minutes

---

## Local Development

```powershell
# Terminal 1 — Backend
cd "d:\Visual code\qurban\backend"
npm run dev        # http://localhost:5000

# Terminal 2 — Frontend
cd "d:\Visual code\qurban\frontend"
npm run dev        # http://localhost:5173
```

The Vite dev server proxies `/api` → `localhost:5000` automatically.

---

## Git Repository Structure

```
qurban/               ← monorepo root (push this to GitHub)
├── render.yaml       ← Render IaC config
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── .env.example  ← Copy to .env for local dev
│   └── ...
└── frontend/
    ├── vercel.json   ← Vercel config (SPA routing, headers)
    ├── .env.example  ← Copy to .env for local dev
    └── ...
```

### Initialize Git

```bash
cd "d:\Visual code\qurban"
git init
git add .
git commit -m "feat: Qurban Monitoring System initial commit"
git remote add origin https://github.com/YOUR_USERNAME/qurban-monitor.git
git push -u origin main
```
