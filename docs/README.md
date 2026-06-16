# Food Freshness Detection System (FFDS)

**Student:** Ananthakumar Srilambotharasarma
**Student ID:** JF/BSCSD/18/42
**Project type:** BSc Final Year Project (12-week build)

> This README is the single source of truth for the project. It defines exactly
> what gets **built and demoed** (the MVP) and what is described in the proposal
> as a **future roadmap / global vision** (not built in this iteration, but the
> architecture is designed so it can scale toward it later).
>
> AI coding agents (Cursor, Antigravity, etc.): read this file fully before
> generating any code. Always build to the **Core MVP** spec in Sections 3.1,
> 5, 6, 8 and 9. Do not implement Section 3.2 items unless explicitly asked.

---

## 1. Overview

FFDS is a machine-learning-powered Progressive Web App (PWA) that lets a user
photograph a fruit, vegetable, or common food item with any smartphone and
receive, within ~2 seconds:

- A **freshness verdict**: Fresh / Borderline / Spoiled
- A **confidence score** (CNN output)
- A set of **simulated gas-sensor readings** (NH₃, H₂S, ethylene) correlated
  with the verdict, demonstrating a multi-modal detection concept without
  physical hardware
- An **AI chatbot explanation** (via Gemini) of *why* the food is in that
  state, health-risk notes, and storage/usage advice
- An entry in the user's **food inventory**, with expiry tracking and
  waste/saved statistics

## 2. Problem Statement

Roughly 1.3 billion tonnes of food is wasted globally each year, much of it
because consumers rely on printed expiry dates or subjective visual checks
rather than objective freshness assessment. Lab-grade detection (gas
chromatography, NIR spectroscopy) is too expensive and inaccessible for
everyday use. FFDS provides a zero-cost, zero-install, smartphone-based
alternative that also helps users track what they have and act before it
spoils.

## 3. Scope

### 3.1 Core MVP — build this now

| Area | What's included |
|---|---|
| Roles | **Consumer** and **Manager** (2 roles, RBAC via JWT) |
| Core scan | Photo upload → CNN classification (Fresh/Borderline/Spoiled + confidence + food type) |
| Gas sensor simulation | Synthetic NH₃ / H₂S / ethylene values generated from the CNN result |
| AI chatbot | Gemini API (`gemini-2.0-flash`), explains scan result, answers follow-up questions, food-specific advice |
| Languages | English + Sinhala (i18next) |
| Inventory & management | Add/edit/remove food items, expiry dates, status (active/consumed/wasted), category filter, waste log |
| Manager dashboard | Aggregated view of team/shop scans + waste report (simple charts) |
| Notifications | In-app "expiring soon" banner/list (no external push service in MVP) |
| Architecture | 3 services: PWA frontend, Core API, CNN inference service |
| Hosting | Vercel (frontend) + Render or Railway (backend services) + MongoDB Atlas — all free tiers |

### 3.2 Future roadmap / global vision — proposal only, NOT built

These are described in the proposal's "Future Work" section to demonstrate
the system's scalability and global potential. **Do not implement these in
the MVP.**

- Additional roles: **Farmer/Supplier** (batch scanning, harvest reports),
  **System Admin** (global analytics)
- Additional languages: Tamil, Arabic, French, Japanese
- Multi-branch business management (one Manager → multiple locations)
- Push notifications via Firebase Cloud Messaging
- Recipe suggestions based on near-expiry items
- Offline-first PWA (full service-worker caching)
- Food-chain-wide / cross-region analytics, FAO/WHO data integration
- Dedicated chatbot microservice (split out from Core API) and Redis caching
  for scaled deployments

---

## 4. System Architecture (MVP — 3 services)

```
                 ┌─────────────────────────────┐
                 │   React 18 PWA (Frontend)    │
                 │  i18next (en, si) + Tailwind │
                 └───────────────┬───────────────┘
                                 │ REST + JWT
                 ┌───────────────▼───────────────┐
                 │       Core API (Node/Express)  │
                 │  Auth, RBAC, Inventory CRUD,    │
                 │  Scan orchestration, Gas-sim,   │
                 │  Gemini chatbot integration     │
                 └───────┬───────────────┬─────────┘
                         │               │
        ┌────────────────▼───┐   ┌───────▼─────────┐
        │  CNN Inference       │   │  MongoDB Atlas   │
        │  Python/FastAPI       │   │  (users, scans,  │
        │  MobileNetV2          │   │  inventory,      │
        └───────────────────────┘   │  chat logs)      │
                                     └───────────────────┘
```

Notes:
- The chatbot (Gemini) is called **from the Core API** as a module in the
  MVP — not a separate microservice. This is simpler to build and test, and
  is documented as a future split-out service for scale (3.2).
- Gas-sensor simulation is a pure function inside the Core API (or CNN
  service) — given a label + confidence, it returns plausible NH₃/H₂S/
  ethylene values within realistic ranges.

---

## 5. Roles & Permissions

| Role | Can do |
|---|---|
| **Consumer** | Scan food, view own scan history, manage own inventory, chat with bot, view own waste stats |
| **Manager** | Everything a Consumer can do, plus: view aggregated scans/inventory for their team/shop, view waste report dashboard, manage staff accounts (basic CRUD) |

Auth: JWT-based. `role` claim in the token determines which API routes and
UI views are accessible.

---

## 6. Feature Details

### 6.1 Scan flow
1. User uploads/captures a photo in the PWA.
2. Core API receives the image, forwards to CNN service.
3. CNN service returns `{ foodType, label, confidence }`.
4. Core API runs the gas-sensor simulation function → `{ nh3, h2s, ethylene }`.
5. Core API sends `{ foodType, label, confidence, gasReadings, language, role }`
   plus the image to Gemini, gets back a natural-language explanation.
6. Core API saves a `Scan` document and returns the full result to the
   frontend (verdict, confidence, gas readings, chatbot explanation).
7. User can optionally add the scanned item to their inventory directly from
   the result screen.

### 6.2 Chatbot (Gemini)
- Model: `gemini-2.0-flash` (free tier — 15 req/min, 1500 req/day, image +
  text input, multilingual output).
- Two interaction modes:
  - **Auto-explanation** after every scan (system prompt includes CNN result,
    gas readings, user role, and language).
  - **Follow-up Q&A**: user can ask free-text questions ("Is this safe for a
    child?", "How should I store this?"); Gemini responds in the user's
    selected language.
- Responses are stored in `chatLogs` linked to the relevant `scanId`.

### 6.3 Inventory & Management
- CRUD for inventory items: name, category (fruit/vegetable/dairy/etc.),
  quantity, unit, purchase date, expiry date, status.
- Items can be created manually or auto-created from a scan result.
- "Expiring soon" view: items expiring within 2 days.
- Waste log: items marked `wasted` are tracked for the waste report.
- Manager dashboard: aggregates inventory + waste across users in the same
  "team"/shop (a `teamId` field links Manager + their Consumers).

### 6.4 Gas Sensor Simulation
- Pure function: given `(label, confidence)`, generate
  `{ nh3: ppm, h2s: ppm, ethylene: ppm }` using ranges that correlate with
  freshness state (e.g. Fresh → low NH₃/H₂S, rising ethylene for ripening
  fruit; Spoiled → elevated NH₃/H₂S).
- Stored with each scan to demonstrate the "multi-modal" detection concept
  in the report and demo, without needing physical sensors.

---

## 7. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js 18 (Vite), Tailwind CSS, i18next (en, si), PWA (vite-plugin-pwa) |
| Core API | Node.js + Express, Mongoose, JWT auth, Multer (image upload) |
| CNN Inference | Python + FastAPI, TensorFlow/Keras, MobileNetV2 |
| Chatbot | Google Gemini API (`gemini-2.0-flash`), via `@google/generative-ai` in Core API |
| Database | MongoDB Atlas (free tier) |
| Hosting | Vercel (frontend), Render or Railway (Core API + CNN service), MongoDB Atlas |
| Testing | Jest + Supertest (Core API), Pytest (CNN service), target ≥80% coverage |

---

## 8. Database Schema (MongoDB collections)

### `users`
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique)",
  "passwordHash": "string",
  "role": "consumer | manager",
  "teamId": "ObjectId | null",
  "language": "en | si",
  "createdAt": "date"
}
```

### `scans`
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "imageUrl": "string",
  "foodType": "string",
  "label": "Fresh | Borderline | Spoiled",
  "confidence": "number (0-100)",
  "gasReadings": { "nh3": "number", "h2s": "number", "ethylene": "number" },
  "chatbotExplanation": "string",
  "createdAt": "date"
}
```

### `inventoryItems`
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "teamId": "ObjectId | null",
  "foodName": "string",
  "category": "fruit | vegetable | dairy | bakery | other",
  "quantity": "number",
  "unit": "string",
  "purchaseDate": "date",
  "expiryDate": "date",
  "status": "active | consumed | wasted",
  "linkedScanId": "ObjectId | null",
  "createdAt": "date"
}
```

### `chatLogs`
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "scanId": "ObjectId | null",
  "language": "en | si",
  "messages": [
    { "role": "user | assistant", "text": "string", "timestamp": "date" }
  ]
}
```

---

## 9. API Endpoints (Core API)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/auth/register` | any | Create account (consumer or manager) |
| POST | `/api/auth/login` | any | Login, returns JWT |
| GET | `/api/auth/me` | auth | Current user profile |
| POST | `/api/scan` | auth | Upload image → CNN + gas-sim + Gemini → save & return result |
| GET | `/api/scans` | auth | List own scan history |
| GET | `/api/scans/:id` | auth | Single scan detail |
| POST | `/api/chat` | auth | Follow-up chatbot question (linked to a scan) |
| GET | `/api/inventory` | auth | List inventory items (own, or team if manager) |
| POST | `/api/inventory` | auth | Add inventory item |
| PUT | `/api/inventory/:id` | auth | Update item (qty, status, expiry, etc.) |
| DELETE | `/api/inventory/:id` | auth | Remove item |
| GET | `/api/inventory/expiring` | auth | Items expiring within 2 days |
| GET | `/api/manager/dashboard` | manager | Aggregated team scans + waste report |

### CNN Inference Service (FastAPI)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/predict` | Accepts an image, returns `{ foodType, label, confidence }` |
| GET | `/health` | Health check |

---

## 10. Datasets

| Dataset | Use | Source | Licence |
|---|---|---|---|
| Kaggle Fresh and Rotten Products (~13,600 images) | Primary CNN training (Fresh/Spoiled classes) | kaggle.com/datasets/crispy23/fresh-and-rotten-products | CC0 |
| Self-collected Sri Lanka dataset (600–900 images) | Adds **Borderline** class + local food relevance | Own photos (fruit/veg market, home) | Own |
| UAT dataset | Usability evaluation (SUS scores, scan accuracy in real use) | 5–10 testers during UAT phase | Own |

> Keep the dataset list lean for the MVP. Fruit-360, Food-101, Plant Disease,
> OpenFoodFacts etc. can be mentioned in the literature review as related
> work / potential future training data, but are not required to hit the
> ≥90% accuracy target on the core fruit/vegetable classes.

---

## 11. Folder Structure (monorepo)

```
/ffds
  /frontend                 # React 18 PWA
    /src
      /components
      /pages
      /i18n                 # en.json, si.json
      /api                   # API client
  /backend
    /core-api                # Node/Express
      /src
        /models              # Mongoose schemas
        /routes
        /controllers
        /services            # gas-sim, gemini-client
        /middleware           # auth, rbac
      /tests
    /cnn-service              # Python/FastAPI
      /app
        main.py
        model.py
      /model                  # trained .h5 / .tflite file
      /training                # training scripts + notebook
      /tests
  /docs
    README.md
    AI_AGENT_BUILD_PROMPTS.md
```

---

## 12. Setup & Installation (local dev)

```bash
# Frontend
cd frontend
npm install
npm run dev

# Core API
cd backend/core-api
npm install
npm run dev   # nodemon

# CNN Service
cd backend/cnn-service
pip install -r requirements.txt --break-system-packages
uvicorn app.main:app --reload --port 8000
```

---

## 13. Environment Variables

### `backend/core-api/.env`
```
PORT=5000
MONGODB_URI=...
JWT_SECRET=...
GEMINI_API_KEY=...
CNN_SERVICE_URL=http://localhost:8000
```

### `backend/cnn-service/.env`
```
MODEL_PATH=./model/ffds_mobilenetv2.h5
PORT=8000
```

### `frontend/.env`
```
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 14. Success Criteria

| Metric | Target |
|---|---|
| CNN classification accuracy | ≥ 90% on test set |
| Inference latency (image → verdict) | ≤ 2 seconds |
| Usability (System Usability Scale) | ≥ 75 |
| Core API test coverage | ≥ 80% |
| Chatbot response relevance (manual review, sample of 20 scans) | ≥ 90% judged "helpful/accurate" |
| Inventory CRUD + expiry alert | All functional tests pass |

---

## 15. 12-Week Build Timeline

| Week | Phase |
|---|---|
| 1 | Requirements finalisation, literature review write-up |
| 2 | System design, DB schema, API contract, UI wireframes |
| 3–4 | CNN model training & evaluation (MobileNetV2, target ≥90%) |
| 5 | CNN service (FastAPI) + integration test with sample images |
| 6 | Core API: auth, RBAC, scan endpoint, gas-sim module |
| 7 | Gemini chatbot integration (auto-explanation + follow-up) |
| 8 | Inventory CRUD + expiry logic + manager dashboard |
| 9 | Frontend: scan flow, results, chatbot UI, i18next (en/si) |
| 10 | Frontend: inventory dashboard + manager views, PWA setup |
| 11 | End-to-end testing, deployment (Vercel/Render), UAT with 5–10 users |
| 12 | Bug fixes from UAT, SUS analysis, final report & submission |

---

## 16. Research / Literature Areas (for proposal & report)

- MobileNetV2 vs EfficientNetV2 for lightweight on-device food classification
- Visual indicators of post-harvest spoilage by food category
- Multimodal LLMs (e.g. Gemini) as conversational food-safety advisors
- Role-based access control (RBAC) design in web applications
- Food waste tracking apps and household food-management systems
- PWA adoption and offline-capability research for low-bandwidth regions
- UN SDG Goal 2 (Zero Hunger) and Goal 12 (Responsible Consumption and
  Production) as motivating frameworks
- (Future-work framing) Multi-language NLP for global consumer health
  applications; IoT/smart-fridge integration; food-chain analytics

---

## 17. Notes for AI Coding Agents

- Always check this README before generating code for any module.
- Build **only** the Core MVP (Section 3.1). Anything in Section 3.2 should,
  at most, be a commented stub or a short note in code comments / docs — not
  implemented.
- Keep the chatbot as a module inside Core API, not a separate service.
- Keep to 2 roles (`consumer`, `manager`) and 2 languages (`en`, `si`).
- Use the exact collection/field names in Section 8 and endpoints in
  Section 9 so frontend and backend stay consistent.
- See `AI_AGENT_BUILD_PROMPTS.md` for the step-by-step build order.
