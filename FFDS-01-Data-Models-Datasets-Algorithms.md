# FFDS — Data Models, Datasets & Algorithms

**Document 1 of 3 — Technical Research Specification**
*Food Freshness Detection System (FFDS) · BSc Final Year Project*

This document covers the data models, training datasets, and algorithms for the **full system**: the original CNN + Gemini platform, plus the 5 newly added features (Predictive Spoilage, Allergen/Nutrition Detection, WhatsApp/SMS Bot, Farmer-to-Buyer Marketplace, Carbon/Environmental Impact Tracker). Software-only — no physical hardware/sensors.

---

## 1. Core Data Models (Original System)

These already exist in the project structure (`backend/core-api/src/models/`) and remain the backbone everything else attaches to.

| Model | Key Fields | Purpose |
|---|---|---|
| `User` | name, email, passwordHash, role (consumer/manager/farmer/admin), teamId, businessId, farmId, familyId, language (en/si/ta/ar/fr/ja), isActive, lastLogin, createdAt | Auth + role-based routing |
| `Scan` | userId, businessId, farmId, batchId, imageUrl, foodType, label (Fresh/Borderline/Spoiled), confidence, gasReadings {nh3, h2s, ethylene}, chatbotExplanation, chatbotResponse, language, createdAt | One scan event |
| `InventoryItem` | ownerId, ownerType (business/farm/consumer), foodName, category (fruit/vegetable/dairy/bakery/other/meat/bread), quantity, unit, purchaseDate, expiryDate, status (active/consumed/wasted/fresh/expiring/spoiled), location (fridge/pantry/warehouse), linkedScanId, userId (legacy), teamId (legacy), timestamps | Pantry/inventory tracking |
| `Batch` | farmerId, batchName, foodType, totalItems, freshCount, borderlineCount, spoiledCount, qualityScore, estimatedValue, currency, buyerReportUrl, buyerReportQR, createdAt | Farmer batch scans |
| `WasteLog` | ownerId, ownerType (business/farm/consumer), foodName, quantity, unit, estimatedCost, currency, reason, createdAt | Waste analytics |
| `Notification` | userId, type (expiry/lowstock/system), message, isRead, createdAt | Expiry/system alerts |
| `ChatLog` | userId, scanId, language (en/si/ta/ar/fr/ja), messages [{role, text, timestamp}] | Gemini chatbot history |

---

## 2. New Data Models (5 Added Features)

| Model | Key Fields | Feature |
|---|---|---|
| `SpoilagePrediction` | scanId, foodType, currentScore, tempC, humidityPct, predictedDaysLeft, modelVersion | Predictive Spoilage |
| `NutritionInfo` | foodType, fdcId (USDA), calories, macros{}, allergenTags[], cachedAt | Allergen/Nutrition |
| `AllergyProfile` | userId, familyMemberName, allergens[] | Allergen/Nutrition |
| `WhatsAppSession` | phoneNumber, userId(optional), lastMessageSid, language, createdAt | WhatsApp/SMS Bot |
| `Listing` | farmerId, batchId, priceUnit, quantity, location, qualityScore, status (available/sold/expired) | Farmer Marketplace |
| `Interest` | listingId, buyerId(managerId), message, status, createdAt | Farmer Marketplace |
| `CarbonLog` | userId, itemId, foodType, weightKg, co2eSavedKg, action (consumed/wasted), date | Carbon Tracker |

---

## 3. CNN Image Classification (Original Core)

### 3.1 Algorithm
**MobileNetV2** (transfer learning) remains the right choice — it's lightweight enough for ≤2s inference on modest hardware/cloud and well suited to mobile-first PWAs. Research on this exact problem also benchmarks alternatives worth knowing for the project's literature review:

- **VGG16 / VGG19 (transfer learning)** — one study reported up to 98.6% accuracy on a public fruit/vegetable dataset after full fine-tuning + data augmentation, outperforming a baseline MobileNetV2-style setup, at the cost of a heavier model.
- **YOLOv4 / YOLOv5** — used when the project also needs to *localize* the produce in the frame (bounding boxes), not just classify it; useful if you ever support multi-item images.
- **Classical ML baselines (SVM, Random Forest, KNN)** on handcrafted features (HOG, LBP, color histograms) — cited in literature as faster but less accurate than CNNs; good for comparison tables in your dissertation.

**Recommendation:** keep MobileNetV2 as production model, mention VGG19 as the "higher-accuracy, heavier" alternative in your comparison/evaluation chapter.

### 3.2 Three-Class vs Binary Output
Several recent papers move beyond binary fresh/rotten to a **3-class scheme** (pure-fresh / medium-fresh / rotten), which maps directly onto your existing Fresh/Borderline/Spoiled verdict — this is good validation that your chosen UX matches current research direction, not just a design choice.

### 3.3 Datasets (real, citable, freely available)
| Dataset | Size | Classes | Notes |
|---|---|---|---|
| Fresh and Rotten/Stale Fruits & Vegetables Classification (Kaggle) | Thousands of images | Fresh / rotten across apples, oranges, bananas, tomatoes, cucumbers, carrots, etc. | Good general-purpose starter set |
| Fruits and Vegetables Dataset — Mukhiddinov et al. 2022 (Kaggle) | 12,000 images | 20 classes (5 fruits + 5 vegetables × fresh/rotten) | Backed by a peer-reviewed Sensors journal paper — citable in your literature review |
| Fruits Fresh and Rotten for Classification (Kaggle, Fruit360-derived) | Large, well-used in tutorials | Binary fresh/rotten | Most commonly used in beginner CNN tutorials — good for a baseline model |
| FruitVeg Freshness Dataset (academic, hand-held camera captures) | 60,000 images | 11 fruit/vegetable types × 3 freshness levels | Matches your 3-tier verdict exactly; paired with a published VGG-16/YOLO comparison study |

**Recommendation:** train/fine-tune primarily on the Mukhiddinov 12k-image set (citable, peer-reviewed) and validate against the 60k 3-class set if you adopt 3-tier labels project-wide.

---

## 4. New Feature Algorithms & Data Sources

### 4.1 Predictive Spoilage (days-until-spoilage)
**Approach:** regression, not deep learning — appropriate for BSc scope and small datasets.

- **Inputs (features):** current CNN freshness score, food type, storage temperature (°C), relative humidity (%), days since scan.
- **Algorithm options** (in increasing complexity, pick one):
  1. **Linear/Multiple Regression** — simplest, interpretable, good baseline.
  2. **Random Forest Regressor** — handles non-linear decay curves (e.g. bananas decay faster than apples) better, still light enough for a student project.
  3. **XGBoost** — referenced in literature as effective when combining temperature/humidity sensor-style data with ML for expiry prediction.
- **Feature engineering tip from the literature:** instead of using raw temperature/humidity readings, compute an **"exposure index"** — a cumulative measure of how far temperature/humidity exceeded safe thresholds over time. This captures degradation better than instantaneous snapshots.
- **Scientific basis:** food science **kinetic models** treat spoilage as a chemical reaction whose rate depends on temperature, humidity, light, and oxygen exposure — this is the theoretical justification you can cite for why temp/humidity are valid predictive features, even without real microbiology data.
- **Training data problem & fix:** you won't have a real longitudinal decay dataset. Synthesize one using published shelf-life ranges per food type (apple: ~7 days at room temp / ~30 days refrigerated; banana: ~3-5 days at room temp; tomato: ~4-7 days, etc.) combined with a decay-rate formula, then add noise. This synthetic-data approach is explicitly used in comparable academic shelf-life papers and is defensible in a viva as "literature-derived approximation" given hardware constraints.

### 4.2 Allergen & Nutrition Detection
- **Primary API: USDA FoodData Central** — official US government nutrition database, free, public domain (CC0), no copyright restrictions. Two REST endpoints: Food Search and Food Details. Free tier via DEMO_KEY (low rate limit) or a registered key (1,000 requests/hour). Returns calories, full macro/micronutrient panel, and serving sizes for 300k+ foods.
- **Allergen data gap:** USDA FDC is strong on nutrients but weak on explicit allergen tagging. **Open Food Facts** (free, open, barcode-based) explicitly returns an `allergens` field alongside nutrition and eco-score data — use it as a secondary source specifically for allergen tags, or fall back to a small static JSON map (gluten/nuts/dairy/shellfish) for the ~20 produce items your CNN already classifies, since most fruits/vegetables have few inherent allergens — the bigger value is **cross-contamination warnings** tied to a user's stored `AllergyProfile`.
- **Flow:** CNN label → lookup in USDA FDC (nutrition) + Open Food Facts (allergens) → cache result in `NutritionInfo` (avoid repeat API calls) → cross-check against the active user's `AllergyProfile` → flag in UI if a match is found.

### 4.3 WhatsApp / SMS Bot
- **Recommended service: Twilio WhatsApp Sandbox** for development (free, no business verification needed) → graduate to a registered WhatsApp Sender for production.
- **Flow:** user sends a photo on WhatsApp → Twilio receives it and POSTs a webhook to your backend with a `MediaUrl0` field (image up to 16MB) → backend downloads the image → same CNN + Gemini pipeline as the web app → reply sent back via Twilio's Messaging API as a TwiML or REST response.
- **Constraint to design around:** Twilio enforces a **24-hour customer service window** — you can only send free-form replies within 24 hours of the user's last message; anything outside that window needs a pre-approved message template (relevant if you want to send proactive "your item is expiring" alerts via WhatsApp).
- **Local dev:** use `ngrok` to expose your local backend to Twilio's webhook during development/demo.

### 4.4 Farmer-to-Buyer Marketplace
- No ML needed — this is a CRUD + matching feature.
- **Data flow:** Farmer completes a `Batch` scan → quality score auto-calculated from CNN results → farmer creates a `Listing` (price, quantity, location) → Managers browse/filter `Listing` records (by quality score, price, distance) → Manager sends an `Interest` → Farmer notified, can accept/decline.
- **Optional enhancement:** simple distance-based sort using stored lat/long on `User`/`Listing` (no external mapping API required — Haversine formula is sufficient for a BSc project).

### 4.5 Carbon/Environmental Impact Tracker
- **Algorithm:** none needed beyond a lookup-and-multiply formula: `CO2e saved = weightKg × emissionFactor(foodType)`, triggered when an `InventoryItem` is marked **Consumed** instead of **Wasted**.
- **Data source:** **Our World in Data's "Food: greenhouse gas emissions across the supply chain"** dataset and the **Wolfram Data Repository "Food Carbon Footprint"** dataset (500+ foods, CO2-equivalent per kg, compiled from peer-reviewed sources) are both free and well-documented — use either as your static emission-factor lookup table.
- **Representative values to seed your lookup table** (kg CO2e per kg of food, global averages from the literature): beef ≈ 60–99, lamb/cheese ≈ 20+, pork ≈ 7, poultry ≈ 6, peas ≈ 1, most fruits/vegetables (e.g. apples) ≈ 0.1–0.4. Since FFDS focuses on produce, expect most saved-CO2 numbers to be modest per item — frame the dashboard around **cumulative monthly savings**, not single-scan numbers, so the impact feels meaningful.

---

## 5. Summary Table — Algorithm Choices at a Glance

| Feature | Algorithm | Complexity | Data Source |
|---|---|---|---|
| Food classification | MobileNetV2 (transfer learning) | Medium | Kaggle fruit/veg freshness datasets |
| Predictive spoilage | Random Forest / Linear Regression | Low–Medium | Synthetic, literature-derived decay curves |
| Allergen/Nutrition | API lookup (no ML) | Low | USDA FoodData Central + Open Food Facts |
| WhatsApp Bot | Webhook + existing pipeline (no new ML) | Low | Twilio WhatsApp API |
| Marketplace | CRUD + Haversine distance (no ML) | Low | Internal DB |
| Carbon Tracker | Formula-based lookup (no ML) | Low | Our World in Data / Wolfram emission datasets |

This mix keeps the project's **AI/ML depth concentrated where it matters** (classification + spoilage prediction) while the other four features stay implementation-light and achievable within a BSc project timeline.
