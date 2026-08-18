# Food Freshness Detection System (FFDS)

> **AI-Powered Global Food Safety & Freshness Ecosystem** — Multimodal CNN Image Classification meets Gemini 2.0 Flash Vision AI, Simulated Telemetry Sensors, and an Integrated Fresh Produce Marketplace.

[![UN SDG Goal 12](https://img.shields.io/badge/UN%20SDG-Goal%2012-green?style=flat-square)](https://sdgs.un.org/goals/goal12)
[![PWA](https://img.shields.io/badge/PWA-Ready-blue?style=flat-square)](https://web.dev/progressive-web-apps/)
[![Languages](https://img.shields.io/badge/Languages-6-purple?style=flat-square)](#-multi-language-support)
[![Gemini Vision](https://img.shields.io/badge/AI-Gemini%202.0%20Flash%20Vision-orange?style=flat-square)](https://deepmind.google/technologies/gemini/)
[![Vercel Ready](https://img.shields.io/badge/Vercel-Serverless-black?style=flat-square)](https://vercel.com/)

---

## 📖 Overview

**FFDS (Food Freshness Detection System)** is an end-to-end, machine-learning-powered Progressive Web Application (PWA) designed to reduce global food waste and ensure food safety. By combining computer vision, generative AI, gas sensor simulation, inventory tracking, and a direct farm-to-consumer online marketplace, FFDS provides real-time freshness insights and seamless food distribution.

### 🌟 Key Capabilities

- 📸 **AI Freshness Verdict**: Analyze food images in ~2 seconds for instant verdict: 🟢 **Fresh** / 🟡 **Borderline** / 🔴 **Spoiled**.
- 🧠 **Dual Vision AI Engine**: Combined MobileNetV2 Deep Learning model with **Google Gemini 2.0 Flash Vision AI** cross-validation.
- 🧪 **Simulated Gas Telemetry**: Real-time simulated gas sensor readings ($\text{NH}_3$, $\text{H}_2\text{S}$, Ethylene) for hardware-free multi-modal detection.
- 🤖 **Context-Aware Gemini AI Chatbot**: Role-tailored advisory providing health guidance, food storage advice, customized recipes for expiring items, and commercial waste reduction strategies in **6 supported languages**.
- 🛒 **Integrated Fresh Produce Marketplace**: 30+ verified regional food shops, direct ordering, delivery dispatching, and customer review ratings.
- 📊 **Multi-Role Dashboards & Analytics**: Tailored interfaces for Consumers, Business Managers, Delivery Drivers, and System Admins.

---

## 👥 User Roles

FFDS supports **4 active user roles**, each equipped with tailored dashboards, navigation workflows, context-aware Gemini AI advisors, and specific operational capabilities.

> ℹ️ **Consolidation Note**: The standalone *Farmer* role has been consolidated into the **Business / Store Manager** portal (`/manager/batch-scan`), allowing commercial producers and store managers to perform batch produce scans within a single workspace. Legacy `/farmer/*` routes automatically redirect to `/manager/dashboard`.

---

### ⚙️ 1. System Admin
**Who:** Platform administrators & system operators.

| Feature | Details |
|:---|:---|
| **Global Analytics Dashboard** | Real-time platform metrics, total users, daily scans, active shop counts, system health |
| **User & Role Management** | Search, filter, inspect, assign roles, activate or suspend accounts across all roles |
| **CNN Model Operations** | Monitor model classification stats, upload updated weights, perform model verification |
| **Language & Localization** | Manage translation keys across 6 languages, update system copy dynamically |
| **Global Waste Analytics** | Platform-wide food waste prevention statistics, PDF/CSV exportable compliance reports |
| **Broadcast Announcements** | Push platform notifications and targeted system updates to all active user roles |

**Login Route:** `/admin/dashboard`  
**Navigation:** Dashboard | Users | Models | Languages | Reports | Announcements | Shops Map

---

### 🏪 2. Business Manager
**Who:** Restaurant owners, hotel chefs, supermarket managers, canteen supervisors, store owners, and agricultural suppliers.

| Feature | Details |
|:---|:---|
| **Manager Dashboard** | Inventory freshness summary, daily waste cost analytics, staff scan activity, expiry warnings |
| **Batch Bulk Scan** | High-volume produce scan (20–50 items), progress tracking, batch quality certification *(merged from farmer workflow)* |
| **Inventory Oversight** | Track stock batches, automated expiry alerts, category filtering, CSV bulk inventory import |
| **Store & Shop Management** | Manage local verified produce shop profiles, listing hours, address, and product catalogs |
| **Order & Driver Dispatch** | Oversee incoming customer produce orders, assign delivery drivers, track live order status |
| **Waste Analytics & Reports** | Financial loss charts, top wasted produce categories, automated compliance PDF reports |
| **Gemini AI (Business Mode)** | Commercial AI advisor focused on inventory rotation (FIFO), cost reduction, and quality standards |

**Login Route:** `/manager/dashboard`  
**Navigation:** Dashboard | Inventory | Batch Scan | Scans | Waste Analytics | Chatbot | Shop Profile | Orders | Drivers

---

### 🏠 3. Home Consumer
**Who:** Everyday households, families, students, and health-conscious consumers.

| Feature | Details |
|:---|:---|
| **Instant Camera Scan** | Live image capture/upload → instant freshness verdict, gas levels, and Gemini AI analysis |
| **Smart Pantry Tracker** | Color-coded freshness indicators, auto-decay countdowns, smart expiry alerts (1–3 days prior) |
| **AI Recipe Generator** | Gemini-powered zero-waste recipe recommendations generated from expiring pantry items |
| **Online Produce Market** | Browse 30+ verified local produce shops, place orders for fresh food, track live deliveries |
| **Smart Shopping List** | Auto-generated from low or expired pantry items, manual item addition, family list sharing |
| **Settings & Preferences** | Language selection (6 languages), push notifications, reminder intervals, child safety mode |

**Login Route:** `/home` (Scan page)  
**Navigation:** Scan | My Pantry | History | Recipes | Marketplace | Shopping List | Settings

---

### 🛵 4. Delivery Driver
**Who:** Courier drivers, local delivery agents, and transport partners.

| Feature | Details |
|:---|:---|
| **Driver Dashboard** | Active delivery assignments, earnings summary, completed order statistics, real-time status |
| **Duty Toggle** | One-click availability state toggle: `Available` / `Delivering` / `Offline` |
| **Live Order Management** | Accept incoming store delivery orders, view pickup shop and customer delivery addresses |
| **Real-Time Navigation** | Integrated shop/customer coordinate navigation, estimated delivery time tracking |
| **Vehicle Profile** | Assign vehicle mode (Bicycle, Scooter, Motorcycle, Van) and license plate metadata |
| **Socket.IO Notifications** | Instant audio/visual dispatch notifications for new store orders and status updates |

**Login Route:** `/driver/dashboard`  
**Navigation:** Dashboard | Active Deliveries | Driver Profile

---

## 🔑 Test Credentials

Use these pre-seeded demo accounts to test each role within the application:

| Role | Email | Password | Primary Route |
|:---|:---|:---|:---|
| 🏠 **Consumer** | `consumer@gmail.com` | `password123` | `/home` |
| 🏪 **Manager** | `manager@gmail.com` | `123456` | `/manager/dashboard` |
| ⚙️ **Admin** | `admin@gmail.com` | `admin123` | `/admin/dashboard` |
| 🛵 **Driver** | `tamil@gmail.com` | `password123` | `/driver/dashboard` |

> 💡 *Note: New accounts can also be created via the `/register` page with custom role selection, location coordinates, vehicle type, and preferred language.*

---

## 🔄 Application Architecture & Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  FFDS SYSTEM ARCHITECTURE                                   │
│                                                                                             │
│  1. AUTH & ROLE ROUTING ─────────────────────────────────────────────────────────────────┐  │
│     JWT Authentication (RBAC) ──► Post-Login Redirect by Role                            │  │
│     (Consumer ➔ /home | Manager ➔ /manager/dashboard | Admin ➔ /admin | Driver ➔ /driver) │  │
│                                                                                          ▼  │
│  2. MULTIMODAL FRESHNESS DETECTION PIPELINE ──────────────────────────────────────────────┐  │
│     User captures/uploads food photo                                                     │  │
│     │                                                                                    │  │
│     ├──► Core API Orchestrator (Node.js/Express)                                         │  │
│     │     ├── 1. Deep Learning Classification (FastAPI MobileNetV2 Service / Py Fallback)│  │
│     │     ├── 2. Gemini 2.0 Flash Vision AI Cross-Validation                             │  │
│     │     └── 3. Gas Telemetry Simulation (NH₃, H₂S, Ethylene PPM readings)             │  │
│     │                                                                                    │  │
│     ◄── Returns: Verdict (Fresh/Borderline/Spoiled), Confidence %, Gas Logs, AI Advice   │  │
│                                                                                          ▼  │
│  3. CONSUMER PANTRY & ONLINE MARKETPLACE ────────────────────────────────────────────────┐  │
│     • One-click add scan result to Pantry with automated expiry calculation               │  │
│     • Generate Zero-Waste Recipes via Gemini AI for expiring items                        │  │
│     • Order fresh produce from 30+ regional shops in the Marketplace                      │  │
│                                                                                          ▼  │
│  4. ORDER DISPATCH & REAL-TIME DRIVER FULFILLMENT ───────────────────────────────────────┐  │
│     • Order placed ──► Socket.IO notifies Store Manager & Available Delivery Drivers     │  │
│     • Driver accepts delivery ──► Real-time order status updates to Consumer              │  │
│     • Order completed ──► Delivery analytics and store rating feedback saved              │  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Key Modules & Libraries |
|:---|:---|:---|
| **Frontend** | React 18, Vite | Tailwind CSS, React Router v6, i18next, Recharts, Socket.io-client, Lucide Icons, PWA (`vite-plugin-pwa`) |
| **Core API** | Node.js + Express | Mongoose (MongoDB Atlas), JWT (RBAC), Socket.io, Multer, PDFKit, QRCode, Axios |
| **CNN Service** | Python (FastAPI / Flask) | TensorFlow / Keras (MobileNetV2), Pillow, NumPy, Pytest |
| **Vision & GenAI** | Google Gemini API | Gemini 2.0 Flash (`@google/generative-ai`) Vision cross-validation engine |
| **Database** | MongoDB Atlas | Geolocation Indexing (`Point`), Aggregations, Seed script (`seedDemoData.js`) |
| **Serverless Deployment**| Vercel | Vercel Serverless Root API Handler (`api/index.js`), Vite SPA rewriting |

---

## 🌍 Multi-Language Support

FFDS features full internationalization (i18n) across **6 major languages**. Language selection persists in the user profile and automatically adjusts both the UI text and **Gemini AI chatbot response language**.

| Language | Code | UI Coverage | Gemini AI Language |
|:---|:---|:---|:---|
| 🇬🇧 **English** | `en` | ✅ Complete | Native English |
| 🇱🇰 **Sinhala (සිංහල)** | `si` | ✅ Complete | Native Sinhala |
| 🇱🇰 **Tamil (தமிழ்)** | `ta` | ✅ Complete | Native Tamil |
| 🇸🇦 **Arabic (العربية)** | `ar` | ✅ Complete | Native Arabic |
| 🇫🇷 **French (Français)** | `fr` | ✅ Complete | Native French |
| 🇯🇵 **Japanese (日本語)** | `ja` | ✅ Complete | Native Japanese |

---

## 📁 Project Structure

```
ffds/
├── api/                        # Vercel Serverless Root API Entrypoint
│   └── index.js                # Serverless bridge connecting Express to Vercel
│
├── frontend/                   # React 18 PWA Frontend
│   ├── public/                 # Static PWA assets, icons, manifest
│   └── src/
│       ├── api/                # Axios API client setup
│       ├── components/         # Reusable UI components (Navbar, ChatBot, ScanResult)
│       ├── context/            # AuthContext, SocketContext, LanguageContext
│       ├── i18n/               # Translation dictionary JSON files (en, si, ta, ar, fr, ja)
│       └── pages/              # Page layouts grouped by user role
│           ├── admin/          # Admin analytics, user management, announcements
│           ├── consumer/       # Pantry, recipes, marketplace, shopping list, history
│           ├── driver/         # Driver dashboard, live deliveries, profile
│           └── manager/        # Inventory management, batch scanning, staff, shop profiles, orders
│
├── backend/
│   ├── core-api/               # Node.js Express Core Backend
│   │   ├── src/
│   │   │   ├── controllers/    # auth, scan, inventory, order, shop, driver, admin
│   │   │   ├── middleware/     # JWT authentication & RBAC authorization
│   │   │   ├── models/         # User, Scan, InventoryItem, Order, Shop, Review, Batch, etc.
│   │   │   ├── routes/         # Express endpoint routers
│   │   │   └── services/       # geminiClient, cnnClient, gasSim, expiryNotifications
│   │   └── seedDemoData.js     # Comprehensive database seeder (users, shops, demo scans)
│   │
│   └── cnn-service/            # Python FastAPI / Flask CNN Model Service
│       ├── app/                # Classifier loaders, vision models, prediction pipeline
│       ├── model/              # Trained MobileNetV2 Keras model binaries
│       └── training/           # Model training & fine-tuning scripts
│
└── vercel.json                 # Unified Vercel deployment configuration
```

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: 3.9+ (for standalone CNN service)
- **MongoDB**: Local instance or MongoDB Atlas connection string
- **Google Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/)

---

### 1. Root Workspace Setup

Install dependencies across the root repository:

```bash
# Clone the repository
git clone https://github.com/Srilambo/ffds.git
cd ffds

# Install root dependencies
npm install

# Install all workspace dependencies (frontend + backend core-api)
npm run install:all
```

---

### 2. Configure Environment Variables

**`backend/core-api/.env`**
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ffds
JWT_SECRET=your-secure-jwt-secret
GEMINI_API_KEY=your-google-gemini-api-key
CNN_SERVICE_URL=http://localhost:8000
```

**`frontend/.env`**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

### 3. Seed Demo Data

Populate the database with pre-configured users across all active roles, 30 verified regional shops, and sample inventories:

```bash
cd backend/core-api
node seedDemoData.js
cd ../..
```

---

### 4. Run Development Servers

**Option A: Run Express API + React Frontend concurrently from root:**
```bash
npm run dev
# Express Core API  ➔ http://localhost:5000
# React Frontend    ➔ http://localhost:5173
```

**Option B: Run Python CNN Classification Service (Optional / Microservice mode):**
```bash
cd backend/cnn-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# FastAPI Service   ➔ http://localhost:8000
```

---

## ✅ Quality & Performance Metrics

| Metric | Target | Status |
|:---|:---|:---|
| **CNN Food Classification Accuracy** | $\ge 90\%$ on benchmark test dataset | ✅ Verified |
| **Gemini Vision Cross-Validation** | Multimodal validation & dual fallback | ✅ Verified |
| **Inference & Verdict Latency** | $\le 2.0$ seconds total response time | ✅ Verified |
| **System Usability Scale (SUS)** | Score $\ge 75/100$ | ✅ Verified |
| **Multi-Language Coverage** | 6 Languages supported end-to-end | ✅ Verified |

---

*FFDS — Food Freshness Detection System · BSc Final Year Project · UN SDG Goal 12*
