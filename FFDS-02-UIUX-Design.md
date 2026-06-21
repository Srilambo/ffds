# FFDS — Web & App UI/UX, Layout & Design

**Document 2 of 3 — Design Research Specification**
*Food Freshness Detection System (FFDS) · BSc Final Year Project*

Covers UI/UX direction for the full system (4 role dashboards + the 5 new features), grounded in current (2026) mobile/web design research.

---

## 1. Core Design Principles (research-backed)

- **Bottom navigation for mobile.** Both Apple's Human Interface Guidelines and Google's Material Design 3 spec recommend bottom navigation with 3–5 primary destinations as the default mobile pattern in 2026 — it keeps core actions within thumb reach and reduces navigation friction. FFDS's existing per-role nav lists (5–7 items) should collapse to the 4–5 most-used items in the bottom bar, with the rest under a "More" tab.
- **Clear visual hierarchy + legible typography.** Consistent type scale, generous line spacing, and high contrast — especially important here since freshness verdicts must be scannable in under a second.
- **Consistency across roles.** Same color system, iconography, and component library across Consumer/Manager/Farmer/Admin — only the *content* changes per role, not the visual language. This also cuts dev/design time significantly.
- **Dark mode support.** Expected by users in 2026, reduces eye strain, and improves battery life on OLED screens — worth including even at MVP stage since it's largely a token-swap exercise if you set up CSS variables properly from the start.
- **Accessibility.** Sufficient color contrast (don't rely on color alone for fresh/borderline/spoiled — pair with icons/labels for colorblind users), legible font sizes, and screen-reader-friendly markup.
- **AI personalization & micro-interactions** are flagged as leading 2026 trends — relevant here since FFDS already has an AI core (Gemini); small delightful touches (a subtle animation when a scan completes, a gentle pulse on expiring items) reinforce the "smart" feel without heavy redesign cost.

---

## 2. Color System — Freshness Semantic Palette

The core visual language of FFDS is the **traffic-light freshness signal**, so the color system should be built around it first, then everything else (role themes, charts) derives from it.

| Status | Color (suggested) | Usage |
|---|---|---|
| Fresh 🟢 | Green (`#22C55E` family) | Verdict badge, pantry item border, dashboard "good" stats |
| Borderline 🟡 | Amber (`#F59E0B` family) | Verdict badge, "use soon" alerts, recipe-suggestion trigger |
| Spoiled 🔴 | Red (`#EF4444` family) | Verdict badge, waste-log entries, urgent notifications |
| Neutral / brand | A calm green or teal as primary brand color (food + sustainability association) | Buttons, nav, headers |

**Important UX rule (accessibility):** never rely on color alone — every freshness badge should pair the color with an icon (🟢🟡🔴 or check/warning/x) and a text label, since ~8% of men have some form of color vision deficiency.

---

## 3. Per-Role Layout

### 3.1 Consumer (`/home`)
- **Bottom nav (5 items):** Scan · Pantry · History · Recipes · Shopping List (Settings tucked under profile icon, not bottom nav)
- **Scan screen:** full-bleed camera viewfinder, large circular shutter button (thumb-reachable, bottom-center), result appears as a bottom sheet that slides up — verdict badge + confidence + auto-triggered Gemini explanation below it.
- **Pantry screen:** two tabs (Fridge/Pantry), card grid with color-coded left border matching freshness status, expiry countdown chip on each card.
- **New feature placements:**
  - *Predictive Spoilage*: small countdown text under each pantry card ("≈2 days left") instead of a separate screen — keeps it lightweight.
  - *Allergen/Nutrition*: expandable section within the scan result bottom sheet ("Nutrition & Allergens ▾"), plus a one-time allergy profile setup in Settings.
  - *Carbon Tracker*: a single stat card at the top of the History screen ("12.4 kg CO₂ saved this month") rather than a whole new tab — keeps cognitive load low for a casual user.

### 3.2 Business Manager (`/manager/dashboard`)
- Pattern follows the **Shopify-style business dashboard model**: complex workflows organized into clearly labeled sections, with a guided setup for first-time managers and deeper settings available for advanced use, so the dashboard scales from a small café owner to a supermarket chain.
- **Layout:** left sidebar nav (desktop) / bottom nav + drawer (mobile) — Dashboard (`/manager/dashboard`), Inventory (`/manager/inventory`), Staff (`/manager/staff`), Scans (`/manager/scans`), Waste Analytics (`/manager/waste`), Chatbot (`/manager/chatbot`), Branches (`/manager/branches`).
- **Dashboard home:** KPI cards row (inventory value, waste cost this week, active alerts) + a waste trend chart (Recharts) below.
- **New feature placements:**
  - *Marketplace*: new nav item "Marketplace" — browse farmer `Listing`s as a card grid (photo, quality score badge, price, distance), filterable like an e-commerce category page.
  - *Carbon Tracker*: a chart on the existing Waste Analytics page, not a new page — frame as "Environmental Impact" tab alongside the existing waste cost chart.

### 3.3 Farmer/Supplier (`/farmer/dashboard`)
- **Batch Scan screen is the centerpiece** — design it like a bulk upload tool: drag-and-drop or multi-select camera roll, progress bar per image, then a results grid (thumbnail + verdict) once processing completes.
- **Buyer Reports:** a shareable "certificate" card layout with a prominent QR code, quality score, and batch photo — designed to look good as a screenshot/PDF since farmers will share it externally.
- **New feature placements:**
  - *Marketplace*: "List for Sale" button appears directly on a completed batch result — minimal extra navigation, since farmers will naturally go batch → list flow.
  - *WhatsApp Bot*: promote this heavily in the Farmer onboarding flow specifically (a banner: "Scan via WhatsApp — no app needed") since this role most benefits from low-tech access; the web/app UI itself doesn't need a dedicated screen for it beyond a settings toggle showing the bot's phone number/QR.

### 3.4 Admin (`/admin/dashboard`)
- **Pattern:** classic admin-panel/analytics layout — left sidebar, dense data tables, global filters at the top of each page.
- **Dashboard home:** world map with scan-density markers (matches existing "active countries map" feature), plus system health and total-user KPI cards.
- No new feature requires a dedicated Admin screen beyond extending **User Management** to show role-specific stats (e.g. number of active marketplace listings, WhatsApp bot sessions) inline in the existing global reports.

---

## 4. Component Patterns to Standardize

| Component | Used In | Notes |
|---|---|---|
| Freshness badge | Everywhere | Color + icon + label, never color-only |
| Result bottom sheet | Consumer scan, Farmer batch | Slide-up panel, swipe-to-dismiss |
| KPI card | Manager/Admin dashboards | Big number + label + small trend arrow |
| Listing card | Marketplace (Farmer + Manager) | Photo, quality badge, price, location, CTA button |
| Expiry chip | Pantry, Inventory | Color-coded countdown text |
| Chat bubble | Gemini chatbot (all 4 modes) | Same component, different system-prompt content per role |

---

## 5. Food-App-Specific UX Notes

Drawing from food-app design research broadly (delivery/grocery apps), a few patterns transfer directly even though FFDS isn't an ordering app:

- **Predictive/instant search** in the Pantry and Marketplace screens — show thumbnail, name, quantity, and a quick action button directly in search results, rather than requiring a full navigation to a detail page.
- **Sticky, always-accessible search/scan entry point** — for Consumer, the scan button should be reachable from nearly every screen (floating action button), since "scan something" is the single highest-frequency action in the whole app.
- **Splash screen with brand identity** on cold start — small touch, but builds trust/recognition, especially relevant since FFDS targets non-technical users (elderly, rural farmers) who benefit from a clear "this app is working" moment.

---

## 6. PWA-Specific Considerations

- Since the original stack already targets a installable PWA (`vite-plugin-pwa`), prioritize: offline-capable shell (cached nav + last-seen pantry data), a clear "Add to Home Screen" prompt timed after a successful first scan (not on first load — let users see value first), and camera permission requests with a clear contextual explanation ("We need camera access to scan your food") rather than a bare browser permission popup.
- For Farmer role specifically (rural/low-connectivity use case), design every screen to **render usefully on poor connections**: skeleton loaders, optimistic UI for batch scan progress, and graceful retry rather than blocking spinners.

---

## 7. Recommended Next Step

Once this direction is approved, the natural next artifact is **low-fidelity wireframes** (Figma or even a clickable HTML prototype) for: Consumer scan flow, Manager marketplace browse, Farmer batch-scan-to-listing flow. Say the word and a wireframe/mockup can be generated directly in this chat.
