# FFDS Deployment Guide

Step-by-step instructions for deploying FFDS to production using free-tier hosting.

---

## Prerequisites

- GitHub repository connected to Render and Vercel
- Trained CNN model file (`ffds_mobilenetv2.h5`) in `backend/cnn-service/model/`
- Google Gemini API key
- MongoDB Atlas account

---

## 1. Deploy MongoDB Atlas (M0 free tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Create a new **M0 (Free)** cluster (choose a region close to your Render services).
3. Under **Database Access**, create a database user with read/write permissions.
4. Under **Network Access**, add `0.0.0.0/0` (allow from anywhere) so Render can connect.
5. Click **Connect** on your cluster → **Drivers** → copy the connection string.
6. Replace `<password>` with your database user password and set the database name to `ffds`:

   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ffds?retryWrites=true&w=majority
   ```

Save this connection string — you will use it as `MONGODB_URI` in Step 3.

---

## 2. Deploy CNN Service to Render

1. Log in to [Render](https://render.com) and click **New → Web Service**.
2. Connect your GitHub repo and select the `backend/cnn-service` directory as the root.
3. Configure the service:
   - **Name:** `ffds-cnn-service`
   - **Environment:** Python
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health check path:** `/health`
4. Set environment variables:

   | Key | Value |
   |---|---|
   | `MODEL_PATH` | `./model/ffds_mobilenetv2.h5` |
   | `PORT` | `8000` |

5. Deploy and wait for the service to become healthy.
6. Copy the public URL (e.g. `https://ffds-cnn-service.onrender.com`).

> **Note:** Ensure the trained model file is committed to the repo or uploaded to the service. Render free-tier services spin down after inactivity; the first request may take ~30 seconds.

Alternatively, use the included `render.yaml` Blueprint in `backend/cnn-service/render.yaml`.

---

## 3. Deploy Core API to Render

1. In Render, click **New → Web Service** and select `backend/core-api` as the root directory.
2. Configure the service:
   - **Name:** `ffds-core-api`
   - **Environment:** Node
   - **Build command:** `npm install`
   - **Start command:** `node src/server.js`
   - **Health check path:** `/api/auth/me` (returns 401 when healthy, not 500)
3. Set all environment variables from [Section 13](README.md#13-environment-variables):

   | Key | Value |
   |---|---|
   | `PORT` | `5000` |
   | `MONGODB_URI` | Your Atlas connection string from Step 1 |
   | `JWT_SECRET` | A long random secret string (e.g. generate with `openssl rand -hex 32`) |
   | `GEMINI_API_KEY` | Your Google Gemini API key |
   | `CNN_SERVICE_URL` | CNN service URL from Step 2 (no trailing slash) |

4. Deploy and verify the service is healthy.
5. Copy the public URL (e.g. `https://ffds-core-api.onrender.com`).

Alternatively, use the included `render.yaml` in `backend/core-api/render.yaml`.

---

## 4. Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com) and click **Add New → Project**.
2. Import your GitHub repo and set the **Root Directory** to `frontend`.
3. Configure build settings (auto-detected from `vercel.json`):
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Set environment variables:

   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://ffds-core-api.onrender.com/api` (your Core API URL + `/api`) |

5. Deploy and copy the Vercel domain (e.g. `https://ffds.vercel.app`).

---

## 5. Update Core API CORS to Allow the Vercel Domain

The Core API currently uses open CORS (`app.use(cors())`). For production, restrict it to your Vercel domain:

1. In `backend/core-api/src/app.js`, update the CORS configuration:

   ```javascript
   app.use(cors({
     origin: [
       'https://ffds.vercel.app',        // your Vercel production domain
       'http://localhost:5173',           // local dev
     ],
     credentials: true,
   }));
   ```

2. Commit and push — Render will auto-redeploy the Core API.

Alternatively, set a `CORS_ORIGIN` environment variable in Render and read it in `app.js` so you do not need to redeploy for domain changes.

---

## Verification Checklist

After all services are deployed:

- [ ] CNN service `/health` returns `{ "status": "ok", "model_loaded": true }`
- [ ] Core API `/api/auth/me` returns 401 (not 500)
- [ ] Frontend loads at the Vercel URL
- [ ] Register/login works end-to-end
- [ ] Scan flow completes (image upload → CNN → Gemini explanation)
- [ ] Inventory CRUD and manager dashboard work

---

## Service URLs Summary

| Service | Platform | Example URL |
|---|---|---|
| Frontend | Vercel | `https://ffds.vercel.app` |
| Core API | Render | `https://ffds-core-api.onrender.com` |
| CNN Service | Render | `https://ffds-cnn-service.onrender.com` |
| Database | MongoDB Atlas | `mongodb+srv://...` |
