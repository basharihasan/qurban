# 🌙 Qurban Monitoring System

Sistem digital untuk mengelola operasi qurban — pendaftaran mudhohi, monitoring penyembelihan real-time, dan distribusi daging qurban secara transparan.

## 🚀 Quick Links

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — Full deployment guide (Vercel + Render + Supabase)
- **Frontend**: React 18 + Vite + TailwindCSS → **Deploy to Vercel**
- **Backend**: Node.js + Express + Socket.IO → **Deploy to Render (Docker)**
- **Database**: PostgreSQL → **Supabase**

## 🏗️ Tech Stack

| Layer | Technology | Deploy Target |
|---|---|---|
| Frontend | React 18 + Vite + TailwindCSS v3 | Vercel (free) |
| Backend | Node.js + Express + Socket.IO | Render (free) |
| Database | PostgreSQL + Knex.js | Supabase (free) |
| Auth | JWT (access + refresh tokens) | — |
| Notifications | WhatsApp (Fonnte API) | — |

## 🔑 Demo Credentials

| Role | Phone | Password | Notes |
|---|---|---|---|
| **Admin** | `08100000000` | `admin123` | Full access |
| **Panitia** | `08100000001` | `panitia123` | Operational |
| **Mudhohi** | `08111111111` | `08111111111` | First login → must change |

## 📱 Features

| Module | Admin | Panitia | Mudhohi |
|---|---|---|---|
| Dashboard + Charts | ✅ | ✅ | ✅ |
| Manage Users + Import Excel | ✅ | — | — |
| Manage Animals + QR Labels | ✅ | — | — |
| Slaughter Tracking | ✅ | ✅ | 👁 |
| Distribution Management | ✅ | ✅ | 👁 |
| QR Code Scanner | — | ✅ | — |
| Delivery Confirmation | — | — | ✅ |
| Reports + Audit Log | ✅ | — | — |
| Dark Mode | ✅ | ✅ | ✅ |
| WhatsApp Notifications | ✅ | — | 📩 |

## 🚀 Local Development

### Prerequisites
- Node.js v18+
- PostgreSQL (running locally) or Supabase project

### Backend

```powershell
cd backend
copy .env.example .env
# Edit .env → set DATABASE_URL or DB_* variables

npm install
npm run migrate    # Create tables
npm run seed       # Load demo data
npm run dev        # → http://localhost:5000
```

### Frontend

```powershell
cd frontend
copy .env.example .env
# Edit .env → VITE_API_URL=http://localhost:5000/api

npm install
npm run dev        # → http://localhost:5173
```

The Vite dev server automatically proxies `/api` to `localhost:5000`.

## 📁 Project Structure

```
qurban/
├── render.yaml           Render IaC (auto-configure backend)
├── DEPLOYMENT.md         Full deployment instructions
├── backend/
│   ├── Dockerfile        Multi-stage Docker build for Render
│   ├── .env.example      All required env vars documented
│   ├── knexfile.js       DB config (DATABASE_URL + SSL)
│   ├── server.js         Express + Socket.IO (prod-ready)
│   └── src/
│       ├── controllers/  Auth, users, animals, mudhohi, distributions, reports
│       ├── db/
│       │   ├── migrations/  7 tables
│       │   └── seeds/       Demo data
│       ├── middleware/   JWT, RBAC, audit, error handler
│       ├── routes/       All REST endpoints
│       ├── services/     WhatsApp notification (Fonnte)
│       └── socket/       Socket.IO realtime events
└── frontend/
    ├── vercel.json       SPA rewrites + security headers
    ├── vite.config.js    Code-split build (12 bundles)
    ├── .env.example      VITE_API_URL template
    └── src/
        ├── components/   UI + layout components
        ├── pages/        Login, Admin, Panitia, Mudhohi pages
        ├── services/     Axios + Socket.IO client
        ├── store/        Zustand (auth + theme)
        └── utils/        Helpers, constants, formatters
```

## 🏥 Health Check

```bash
GET /api/health
```

Returns database connectivity, uptime, and environment info.
Used by Render to determine service health.

## ⚙️ Production Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full step-by-step guide.

Summary:
1. Set up Supabase project → get `DATABASE_URL`
2. Push repo to GitHub
3. Create Render Web Service → connect repo → set env vars
4. Create Vercel project → connect `frontend/` → set `VITE_API_URL`
5. Update `FRONTEND_URL` in Render with your Vercel URL

## 📄 License

MIT — Free to use for non-commercial Islamic charity projects.
