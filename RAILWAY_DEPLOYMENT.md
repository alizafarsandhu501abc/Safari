# Railway Deployment Guide (Nixpacks / TOML)

This guide deploys the **Secure Cloud Log Analyzer (Safari)** on [Railway](https://railway.app) as two separate services from the same GitHub repository.

> **Pre-configured files** — `nixpacks.toml` files are already created for both services. Just follow the steps below.

---

## Step 1 — Push to GitHub

Make sure your full repository is pushed to GitHub:
```bash
git add .
git commit -m "production ready"
git push origin main
```

---

## Step 2 — Create a Railway Project

1. Go to [railway.app](https://railway.app) and sign in.
2. Click **New Project**.

---

## Step 3 — Deploy the Backend Service

1. Click **+ New** → **GitHub Repo** → select your repository.
2. Go to the service **Settings** tab:
   - **Service Name**: `safari-backend`
   - **Root Directory**: `complete_backend`
3. Go to the **Variables** tab and add these environment variables:

   | Variable | Value |
   |---|---|
   | `PORT` | `5000` |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | `your_neon_postgresql_connection_url` |
   | `JWT_SECRET` | `your_secure_secret_key` |
   | `JWT_EXPIRES_IN` | `24h` |
   | `PYTHON_PATH` | `python3` |
   | `MAPREDUCE_WORKERS` | `4` |

4. Railway will automatically detect the `nixpacks.toml` at `complete_backend/nixpacks.toml`, install **Node.js** and **Python 3**, and deploy.
5. Once deployed, go to **Settings** → **Networking** → click **Generate Domain** to get your backend URL (e.g. `https://safari-backend-production-xxxx.up.railway.app`).

---

## Step 4 — Deploy the Frontend Service

1. In the same Railway project, click **+ New** → **GitHub Repo** → select the same repository.
2. Go to the service **Settings** tab:
   - **Service Name**: `safari-frontend`
   - **Root Directory**: `frontend`
3. Go to the **Variables** tab and add:

   | Variable | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://your-backend-url.up.railway.app` *(from Step 3.5)* |

4. Railway will detect `frontend/nixpacks.toml`, build the Vite React app, and serve it.
5. Go to **Settings** → **Networking** → click **Generate Domain** to get your public frontend URL.

---

## Step 5 — Verify

1. Open your frontend URL in the browser.
2. Register a new account or log in.
3. Upload a `.log` or `.txt` file from the dashboard.
4. Watch the job process in real-time without refreshing — charts and metrics update automatically.

---

## File Reference

| File | Purpose |
|---|---|
| `complete_backend/nixpacks.toml` | Backend build config (Node.js + Python 3) |
| `frontend/nixpacks.toml` | Frontend build config (Vite build + preview server) |
| `complete_backend/.env` | Local-only env vars (not deployed — use Railway Variables tab instead) |
| `frontend/.env` | Local-only env vars (not deployed — use Railway Variables tab instead) |

---

## Troubleshooting

- **403 Forbidden on dashboard**: Your JWT token has expired. Log out and log back in.
- **MapReduce job fails**: Check Railway logs for the backend service. Ensure `PYTHON_PATH` is set to `python3`.
- **Frontend shows blank page**: Ensure `VITE_API_BASE_URL` points to your Railway backend URL (with `https://`).
- **CORS errors**: The backend allows all origins by default. If you restrict CORS in production, whitelist your frontend domain.
