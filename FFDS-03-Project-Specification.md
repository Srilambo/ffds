# FFDS — Project Specification

**Document 3 of 3 — Project Details, Roles, Usage, Credentials & AI Prompts**
*Food Freshness Detection System (FFDS) · BSc Final Year Project · UN SDG Goal 12*

> [!NOTE]
> This specification has been fully verified and aligned with the MongoDB collection schemas, route handlers, and multi-role middleware implemented in the `backend/core-api` codebase.

> This is the document type usually called a **Project/System Specification** (sometimes "SRS — Software Requirements Specification" in academic submissions). It's the right place for role definitions, usage flows, test accounts, and exact AI prompt templates, since these are operational details examiners/supervisors will want to see clearly listed, separate from the technical (Doc 1) and design (Doc 2) research.

---

## 1. Project Overview

FFDS is a machine-learning-powered Progressive Web App that lets anyone photograph a fruit, vegetable, or food item and receive a freshness verdict (Fresh/Borderline/Spoiled) with CNN confidence score, an AI chatbot explanation, and inventory tracking — extended with 5 additional features: Predictive Spoilage, Allergen/Nutrition Detection, WhatsApp/SMS Bot access, a Farmer-to-Buyer Marketplace, and a Carbon/Environmental Impact Tracker.

**Tech stack (unchanged core + new integrations):**

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, i18next (6 languages), PWA |
| Core API | Node.js + Express, Mongoose, JWT Auth (RBAC), Multer |
| CNN Service | Python + FastAPI, TensorFlow/Keras, MobileNetV2 |
| AI Chatbot | Google Gemini 2.0 Flash API |
| Database | MongoDB Atlas |
| **New:** Nutrition/Allergen | USDA FoodData Central API + Open Food Facts API |
| **New:** Low-tech access | Twilio WhatsApp Business API |
| **New:** Marketplace | Internal Listing/Interest models (no external API) |
| **New:** Carbon tracking | Static emission-factor dataset (Our World in Data / Wolfram) |

---

## 2. Roles & Permissions Matrix

| Capability | Consumer | Manager | Farmer | Admin |
|---|:---:|:---:|:---:|:---:|
| Scan food (single) | ✅ | ✅ | ✅ | – |
| Batch scan (20–50 images) | – | – | ✅ | – |
| View own pantry/inventory | ✅ | ✅ (business) | – | – |
| Manage staff accounts | – | ✅ | – | ✅ (all users) |
| Waste analytics | Personal | Team/branch | Loss tracker | Global |
| Gemini chatbot | Consumer mode | Manager mode | Farmer mode | Admin mode |
| Predictive spoilage view | ✅ | ✅ | ✅ (batch-level) | – |
| Allergen/nutrition lookup | ✅ | ✅ | – | – |
| WhatsApp bot access | ✅ | – | ✅ (primary use case) | – |
| Create marketplace listing | – | – | ✅ | – |
| Browse/buy marketplace | – | ✅ | – | – |
| Carbon impact dashboard | ✅ (personal) | ✅ (branch) | – | ✅ (global) |
| User management / suspend accounts | – | Staff only | – | ✅ (all) |
| CNN model version management | – | – | – | ✅ |

---

## 3. Usage Workflows

### 3.1 Consumer
1. Register/login → land on `/home` Scan page.
2. Tap camera → capture food photo → CNN + Gemini process (~2s) → verdict + explanation shown.
3. Optionally expand "Nutrition & Allergens" → cross-checked against saved `AllergyProfile`.
4. Add item to Pantry → predictive spoilage countdown shown on the card.
5. Get notified 1–3 days before expiry → mark Consumed (logs CO₂ saved) or Wasted.
6. Alternative path: send the same photo via **WhatsApp** to the FFDS bot number and receive the verdict + explanation as a chat reply — no app required.

### 3.2 Business Manager
1. Login → `/manager/dashboard`.
2. Staff scan inventory throughout the day; Manager reviews via Scan Results.
3. Manager checks Waste Analytics + new Environmental Impact tab for cost and CO₂ trends.
4. Manager browses the **Marketplace** for fresh batches from farmers, filters by quality score/price/distance, sends an Interest.
5. Manager uses Gemini chatbot (Manager mode) for cost-reduction and supplier-quality guidance.

### 3.3 Farmer/Supplier
1. Login (or use WhatsApp bot directly without logging into the app).
2. Batch Scan 20–50 harvest images → quality score + sell/not-ready recommendation generated.
3. Farmer taps "List for Sale" on a completed batch → creates a `Listing` visible to Managers.
4. Farmer receives `Interest` notifications from buyers, accepts/declines.
5. Buyer Reports generate a shareable QR certificate for the sold batch.
6. Gemini chatbot (Farmer mode) advises on harvest timing, transport, and storage.

### 3.4 Admin
1. Login → `/admin/dashboard`.
2. Monitors global analytics, manages users across all roles (including suspending marketplace abuse or WhatsApp bot misuse).
3. Manages CNN model versions, language strings, and global announcements.
4. Reviews global reports including new marketplace and carbon-impact aggregates.

---

## 4. Test Credentials

| Role | Email | Password |
|---|---|---|
| 🏠 Consumer | `consumer@example.com` | `password123` |
| 🏪 Manager | `manager@example.com` | `password123` |
| 🚜 Farmer | `farmer@example.com` | `password123` |
| ⚙️ Admin | `admin@example.com` | `password123` |

> Register new accounts via `/register`. Select role and preferred language at signup. **Security note for the actual build:** passwords must be hashed (bcrypt) before storage — `password123` is a seed/demo value only, never a production default. JWT secrets, Gemini API key, USDA API key, and Twilio credentials all belong in environment variables (`.env`), never committed to source control.

### New environment variables required for the 5 added features

```env
# Allergen/Nutrition
USDA_FDC_API_KEY=your-usda-key

# WhatsApp/SMS Bot
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886   # sandbox number for dev

# (Marketplace and Carbon Tracker need no external keys — internal DB + static dataset)
```

---

## 5. Gemini AI — Prompt Templates (4 Modes + New Feature Extensions)

Each role's chatbot uses the same Gemini integration with a different **system prompt** prepended, plus the user's selected language enforced in every prompt.

### 5.1 Consumer Mode
```
You are a friendly food safety assistant for a home cooking app.
The user just scanned a {foodType} which was classified as {verdict}
with {confidence}% confidence. Explain in simple, non-technical
language: (1) why it received this verdict, (2) any health
considerations, (3) practical storage tips, (4) what to do next.
Respond in {userLanguage}. Keep it warm and concise (under 150 words).
```

### 5.2 Manager Mode
```
You are a food safety and cost-efficiency advisor for a business
account on a restaurant/retail inventory platform. The team scanned
{foodType}, verdict: {verdict} ({confidence}% confidence). Current
inventory context: {inventorySummary}. Advise on: (1) immediate
action for this item, (2) supplier/quality implications if this is
a recurring pattern, (3) one cost-saving or compliance tip. Respond
in {userLanguage}, professional tone, under 150 words.
```

### 5.3 Farmer Mode
```
You are an agricultural advisor for smallholder and commercial
farmers. This batch of {foodType} ({batchSize} items) scored
{qualityScore}% quality, with {freshPct}% fresh / {borderlinePct}%
borderline / {spoiledPct}% spoiled. Advise on: (1) whether to sell
now or wait, (2) transport/storage handling to minimize further
loss, (3) one tip to improve next harvest's freshness outcomes.
Respond in {userLanguage}, practical and direct, under 150 words.
```

### 5.4 Admin Mode
```
You are a technical platform assistant for a system administrator.
Given this context: {analyticsContext}, help the admin understand
the system health signal, suggest one action if the data shows a
concerning pattern (e.g. CNN accuracy drop, spike in spoiled scans
in a region), and answer their follow-up question concisely.
Respond in {userLanguage}, technical tone, under 150 words.
```

### 5.5 New — Predictive Spoilage Explanation (appended to Consumer/Manager prompts)
```
Additionally, this item has a predicted shelf life of
{predictedDaysLeft} days based on current storage conditions
({tempC}°C, {humidityPct}% humidity). Mention this prediction
naturally in your response and suggest one action to extend it
if applicable.
```

### 5.6 New — Allergen Warning (appended when AllergyProfile match found)
```
Important: this item matches an allergen on the user's saved
profile: {matchedAllergen}. You must clearly and prominently
flag this warning before any other advice, in plain language.
```

### 5.7 New — Marketplace Listing Description Generator (Farmer mode, optional)
```
Generate a short, honest, appealing marketplace listing description
(under 40 words) for a batch of {foodType}, quality score
{qualityScore}%, harvested {harvestDate}. Do not exaggerate quality
beyond what the score supports. Respond in {userLanguage}.
```

### 5.8 New — Carbon Tracker Monthly Summary (Consumer/Manager, triggered monthly)
```
Summarize this month's environmental impact in one encouraging
sentence: the user saved {co2SavedKg} kg of CO2-equivalent emissions
by consuming {consumedCount} items instead of wasting them, out of
{totalScans} total scans. Respond in {userLanguage}, positive and
brief (under 40 words). Do not be preachy or guilt-inducing about
the items that were wasted.
```

---

## 6. Summary

This specification, together with Document 1 (data models/datasets/algorithms) and Document 2 (UI/UX/design), gives a complete blueprint for extending FFDS from a single-purpose scan-and-verdict tool into a fuller platform — covering the technical "what," the design "how it looks," and this document's "who does what, with what data, and what the AI says."
