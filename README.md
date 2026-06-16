# Food Freshness Detection System (FFDS)

> **AI-powered global food safety platform** — CNN image classification meets Gemini AI chatbot to reduce food waste worldwide.

[![UN SDG Goal 12](https://img.shields.io/badge/UN%20SDG-Goal%2012-green?style=flat-square)](https://sdgs.un.org/goals/goal12)
[![PWA](https://img.shields.io/badge/PWA-Ready-blue?style=flat-square)](https://web.dev/progressive-web-apps/)
[![Languages](https://img.shields.io/badge/Languages-6-purple?style=flat-square)](#-multi-language-support)

---

## 📖 Overview

FFDS is a machine-learning-powered Progressive Web App (PWA) that lets anyone photograph a fruit, vegetable, or food item and receive — within ~2 seconds:

- A **freshness verdict**: 🟢 Fresh / 🟡 Borderline / 🔴 Spoiled
- A **CNN confidence score** (MobileNetV2 model)
- **Simulated gas-sensor readings** (NH₃, H₂S, Ethylene) — demonstrating multi-modal detection without physical hardware
- An **AI chatbot explanation** (Google Gemini) with health advice, storage tips, and recipe suggestions
- An entry in the user's **inventory**, with expiry tracking and waste analytics

---

## 👥 User Roles

FFDS supports **4 distinct roles**, each with a tailored dashboard, navigation menu, and Gemini AI mode.

### ⚙️ 1. System Admin
**Who:** Platform owners — 1-2 people globally.

| Feature | Details |
|:---|:---|
| **Global Analytics Dashboard** | Total users, scans today, active countries map, system health status |
| **User Management** | Search/filter/sort all users, change roles, suspend or delete accounts |
| **CNN Model Management** | Upload new model versions, track accuracy, A/B test old vs new models |
| **Language Management** | Add languages, edit translation strings, preview UI in each language |
| **Global Reports** | Export PDF/Excel, food waste stats worldwide, country breakdowns |
| **Announcements** | Send push notifications to all users or schedule announcements |

**Login Route:** `/admin/dashboard`
**Navigation:** Dashboard | Users | Models | Languages | Reports | Announcements

---

### 🏪 2. Business Manager
**Who:** Restaurant owners, hotel chefs, supermarket managers, canteen supervisors.

| Feature | Details |
|:---|:---|
| **Manager Dashboard** | Inventory summary, waste cost, staff scan activity, expiry alerts |
| **Inventory Management** | Add/edit/delete food items, filter by category, CSV bulk import |
| **Staff Management** | Create staff accounts, view scan histories, deactivate accounts |
| **Scan Results** | All team scans, filter by date/food/result, view full chatbot conversation |
| **Waste Analytics** | Weekly/monthly waste charts, most wasted food type, PDF compliance reports |
| **Gemini Chatbot (Business Mode)** | AI advisor pre-loaded with inventory context for cost and quality guidance |
| **Branch Management** | Add/remove branches, compare branches on waste and freshness metrics |

**Login Route:** `/manager/dashboard`
**Navigation:** Dashboard | Inventory | Staff | Scans | Waste Analytics | Chatbot | Branches

---

### 🚜 3. Farmer / Supplier
**Who:** Vegetable farmers, fruit growers, food exporters, harvest workers.

| Feature | Details |
|:---|:---|
| **Farmer Dashboard** | Batch summary (fresh/borderline/spoiled %), quality score, sell/not-ready recommendation |
| **Batch Scan** | Upload 20–50 images at once, progress bar, results grid, download PDF quality report |
| **Harvest Calendar** | Calendar of past batches, best sell time recommendations, seasonal trends |
| **Loss Tracking** | Record harvest vs sold vs wasted, financial loss calculator, monthly charts |
| **Buyer Reports** | Shareable batch quality certificate with QR code for buyer verification |
| **Gemini Chatbot (Farmer Mode)** | AI advisor focused on harvest timing, transport, storage temperatures, post-harvest loss reduction |

**Login Route:** `/farmer/dashboard`
**Navigation:** Dashboard | Batch Scan | Calendar | Loss Tracker | Buyer Reports | Chatbot

---

### 🏠 4. Home Consumer
**Who:** Regular people worldwide — families, students, elderly, health-conscious users.

| Feature | Details |
|:---|:---|
| **Scan Page (Home)** | Camera button → instant result → automatic Gemini AI explanation below |
| **My Pantry** | Fridge + Pantry tabs, color-coded freshness, expiry countdown, family sharing |
| **Scan History** | All past scans with thumbnail, date, result, and AI summary |
| **Recipe Suggestions** | Gemini-generated recipes from borderline pantry items — "Use before spoiling" |
| **Shopping List** | Auto-generated from expired/low items, manual add, share with family |
| **Settings** | Language, profile, expiry reminders, push notifications, child safety mode |

**Login Route:** `/home` (Scan page)
**Navigation:** Scan | My Pantry | History | Recipes | Shopping List | Settings

---

## 🔑 Test Credentials

Use these pre-seeded accounts for testing each role:

| Role | Email | Password |
|:---|:---|:---|
| 🏠 Consumer | `consumer@example.com` | `password123` |
| 🏪 Manager | `manager@example.com` | `password123` |
| 🚜 Farmer | `farmer@example.com` | `password123` |
| ⚙️ Admin | `admin@example.com` | `password123` |

> Register new accounts via the `/register` page. Select your role and preferred language on signup.

---

## 🔄 Application Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        USER WORKFLOW                                     │
│                                                                         │
│  1. SIGN UP / LOGIN ────────────────────────────────────────────────┐  │
│     Register with name, email, password, role, and language         │  │
│     JWT token issued → role-based redirect                          │  │
│                                                                     ▼  │
│  2. SCAN FOOD ──────────────────────────────────────────────────────┐  │
│     Upload / capture photo                                          │  │
│     ── Image sent to Core API ──► CNN Service (FastAPI/MobileNetV2)│  │
│     ◄── { foodType, label, confidence }                             │  │
│     Core API runs gas-sensor simulation → NH₃, H₂S, Ethylene       │  │
│     Image + result sent to Gemini AI → natural language explanation │  │
│     Scan record saved to MongoDB Atlas                              │  │
│                                                                     ▼  │
│  3. VIEW RESULT ────────────────────────────────────────────────────┐  │
│     Freshness verdict (Fresh / Borderline / Spoiled) + confidence % │  │
│     Gas sensor readings displayed                                   │  │
│     AI chatbot explanation appears automatically                    │  │
│     Ask follow-up questions in selected language                    │  │
│                                                                     ▼  │
│  4. TRACK INVENTORY ────────────────────────────────────────────────┐  │
│     Add item from scan result (one-click) or manually               │  │
│     Set expiry date and quantity                                     │  │
│     "Expiring Soon" alerts appear 1–3 days before expiry            │  │
│     Mark items as Consumed or Wasted                                │  │
│                                                                     ▼  │
│  5. ANALYTICS ──────────────────────────────────────────────────────┐  │
│     Consumer: personal waste stats, pantry overview                 │  │
│     Manager:  team waste cost charts, staff scan activity           │  │
│     Farmer:   batch quality scores, loss tracking, buyer reports    │  │
│     Admin:    global user counts, country maps, system health       │  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Post-Login Role Routing

```
Login / Register
     │
     ├── role = admin    → /admin/dashboard
     ├── role = manager  → /manager/dashboard
     ├── role = farmer   → /farmer/dashboard
     └── role = consumer → /home (Scan page)
```

### Gemini AI — 4 Mode System

| Role | Chatbot Focus |
|:---|:---|
| **Consumer** | Simple language: why it's spoiling, health risks, what to do, storage tips |
| **Manager** | Professional: cost reduction, supplier quality, staff training, compliance |
| **Farmer** | Agricultural: harvest timing, transport advice, post-harvest loss, sell decisions |
| **Admin** | Technical: platform analytics, user issues, system health guidance |

---

## 🛠️ Tech Stack

| Layer | Technology |
|:---|:---|
| **Frontend** | React 18, Vite, Tailwind CSS, i18next (6 languages), PWA (vite-plugin-pwa) |
| **Core API** | Node.js + Express, Mongoose, JWT Auth (RBAC), Multer (image upload) |
| **CNN Service** | Python + FastAPI, TensorFlow/Keras, MobileNetV2 |
| **AI Chatbot** | Google Gemini 2.0 Flash API (`@google/generative-ai`) |
| **Database** | MongoDB Atlas (free tier) |
| **Charts** | Recharts |

---

## 🌍 Multi-Language Support

| Language | Code | Status |
|:---|:---|:---|
| English | `en` | ✅ Full support |
| Sinhala (සිංහල) | `si` | ✅ Full support |
| Tamil (தமிழ்) | `ta` | ✅ Full support |
| Arabic (العربية) | `ar` | ✅ Full support |
| French (Français) | `fr` | ✅ Full support |
| Japanese (日本語) | `ja` | ✅ Full support |

Language is selected at registration and can be changed in Settings. Gemini AI responds **in the user's selected language**.

---

## 📁 Project Structure

```
ffds/
├── frontend/                   # React 18 PWA
│   └── src/
│       ├── pages/
│       │   ├── admin/          # Admin dashboard & sub-pages
│       │   ├── manager/        # Manager dashboard & sub-pages
│       │   ├── farmer/         # Farmer dashboard & sub-pages
│       │   └── consumer/       # Consumer pantry, recipes, history
│       ├── components/         # Layout, ChatBot, ScanResult, etc.
│       ├── context/            # AuthContext (JWT, role, language)
│       ├── i18n/               # en, si, ta, ar, fr, ja translations
│       └── api/                # Axios API client
│
├── backend/
│   ├── core-api/               # Node.js + Express
│   │   └── src/
│   │       ├── models/         # User, Scan, InventoryItem, Batch, WasteLog, Notification, ChatLog
│   │       ├── routes/         # auth, scan, inventory, manager, admin, chat
│   │       ├── controllers/    # authController, scanController, etc.
│   │       ├── services/       # geminiClient, gasSim
│   │       └── middleware/     # auth (JWT), rbac (role check)
│   └── cnn-service/            # Python FastAPI + MobileNetV2
│
└── docs/                       # Project spec and build guides
```

---

## 💻 Local Development Setup

### Prerequisites
- Node.js v18+
- Python 3.9+
- MongoDB (local or Atlas URI)
- Google Gemini API Key

### 1. Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 2. Core API
```bash
cd backend/core-api
npm install
# Copy .env.example to .env and fill in values
npm run dev
# → http://localhost:5000
```

### 3. CNN Service
```bash
cd backend/cnn-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000
```

### Environment Variables

**`backend/core-api/.env`**
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-key
CNN_SERVICE_URL=http://localhost:8000
```

**`frontend/.env`**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## ✅ Success Criteria

| Metric | Target |
|:---|:---|
| CNN classification accuracy | ≥ 90% on test set |
| Inference latency (image → verdict) | ≤ 2 seconds |
| System Usability Scale (SUS) | ≥ 75 |
| Core API test coverage | ≥ 80% |
| Chatbot response relevance (20 scan sample) | ≥ 90% judged "helpful" |

---

*FFDS — Food Freshness Detection System · BSc Final Year Project · UN SDG Goal 12*
