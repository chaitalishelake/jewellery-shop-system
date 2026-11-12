# MAISON D'OR — Haute Joaillerie & Vault Management System

> **A sober, simple, and aesthetic luxury frontend for jewelry boutiques, ateliers, and vault operations.**

---

## ✦ Overview

**MAISON D'OR** is a complete, production-grade frontend management system crafted specifically for fine jewelry houses, diamond merchants, goldsmith ateliers, and high horology boutiques. It blends understated luxury aesthetics (warm alabaster cream, champagne gold accents, serif typography) with real-world jewelry trade mechanics—including live bullion market repricing, dual gross/net karat weight accounting, old gold scrap trade-in deductions, and master karigar artisan workflows.

---

## ⚜ Key Features & Modules

### 1. Live Bullion Ticker & Dynamic Repricing Engine
* Displays live benchmark rates per gram for:
  * **24K Fine Gold** (99.9%)
  * **22K Sovereign Hallmark** (91.6% BIS)
  * **18K Royal Gold** (75.0%)
  * **14K Fine Gold** (58.5%)
  * **Platinum 950**
  * **Sterling Silver 925**
* **Instant Market Fixing Editor**: Click `⚙ Edit Rates` to adjust today's metal price per gram. The entire catalog valuation and billing terminal automatically recalculate in real-time.
* **Multi-Currency Support**: Instant one-click currency conversion between **USD ($)**, **EUR (€)**, **GBP (£)**, **INR (₹)**, and **AED (د.إ)**.

### 2. Vault & Showcase Catalog (Inventory Management)
* **Dual View**: Switch between **Curated Visual Gallery View** and **Precision Vault Table View**.
* **Jewelry-Specific Metrics**:
  * Gross Scale Weight vs. Net Pure Metal Weight vs. Stone Carats
  * Stone specifications (e.g. D-VVS1 oval diamonds, Zambian emeralds, South Sea pearls)
  * Making charge models: **Per Gram** or **Flat rate**
  * Official certification tags (GIA, IGI, BIS Hallmark IDs)
  * Safe location tracking (Showcase Trays vs. Vault Safes)
* **Interactive Ingestion**: "Register New Ornament" modal with live price estimation as you enter weights and karats.
* Multi-criteria filtering by category, metal purity, and stock status (Available, In Vault, Reserved, Sold).

### 3. POS & Boutique Billing Terminal
* **Dual-Pane Register**:
  * Left pane: Rapid catalog picker with barcode/SKU search and category chips.
  * Right pane: Real-time digital bill register.
* **Old Gold Scrap Trade-in / Exchange Section**:
  * Customers can exchange old or broken gold jewelry.
  * Enter Gross Weight, non-gold stone deduction, and Karat purity (24K, 22K, 18K, 14K).
  * Automatically calculates scrap melt value (with refining loss deduction) and deducts credit directly from the active invoice!
* **Tax & Payment Settlement**:
  * Automatic jewelry sales tax (3% VAT / GST).
  * Supports Centurion Card, Bank Wire, Cash, or Split payments.
* **Boutique Tax Invoice & Certificate**:
  * Generates an authentic high-jewelry printable receipt and hallmark guarantee certificate.
  * Optimized with print stylesheets (`@media print`) for clean physical A4 laser printing (`🖨 Print Invoice`).

### 4. Old Gold Melt & Appraisal Calculator
* Standalone evaluation workbench for walk-in appraisals and scrap buybacks.
* Computes pure metal weight, current market bullion fixing, and shop assay fee to yield net customer payout.
* "Apply to Active POS Bill" button pushes the trade-in credit directly into the register.

### 5. Bespoke Atelier & Workshop (Master Karigar Pipeline)
* Tracks custom bridal and heirloom commissions across 5 stages:
  1. **Design CAD**
  2. **Metal Cast**
  3. **Stone Setting**
  4. **Hallmarking & Laser Assay**
  5. **Ready in Safe for Delivery**
* Tracks metal weight issued to goldsmiths, deposit paid vs. balance due, and promised delivery dates.

### 6. VIP Patrons Registry (Clientele CRM)
* Client directory with ring and wrist sizes, anniversaries, curated gemstone preferences, and lifetime spend tracking.
* One-click "Load to Billing POS" loads customer details directly into the billing register.

### 7. Financial & Physical Metal Ledger (Audit & Reports)
* Reconciles daily sales volume, sales tax collected, and scrap gold received into the vault.
* Physical gold balancing checklist (Morning opening weight minus metal sold plus scrap received equals verified vault balance).

### 8. Aesthetics & Themes
* **Alabaster & Champagne Light Theme**: Clean, sober, warm cream tones with understated gold accents.
* **Nocturne Obsidian Dark Theme**: Deep velvet obsidian background with warm champagne highlights.
* Zero visual clutter, elegant serif headers (`Cormorant Garamond`), crisp data tables (`Plus Jakarta Sans`), and subtle micro-animations.

---

## 🚀 How to Run

### Option 1: Direct Double-Click (Zero Setup Required!)
1. Unzip `jewelry-shop-system.zip`.
2. Double-click `index.html` in any web browser (Google Chrome, Microsoft Edge, Safari, Firefox).
3. The application runs immediately without any terminal, node.js, or server setup!

### Option 2: Run with a Local Static Server (Optional)
If you prefer running via a local server:
```bash
# Using Python
python -m http.server 3000

# Using Node.js
npx serve .
```
Then visit `http://localhost:3000` in your browser.

---

## 📂 Project Structure

```
jewelry-shop-system/
├── index.html            # Main application shell with semantic layout & responsive navigation
├── css/
│   └── custom.css        # Bespoke luxury styling, variables, dark mode & printable invoice styles
├── js/
│   ├── data.js           # Seed catalog, live metal fixing rates, VIP clientele & workshop commissions
│   ├── store.js          # Reactive state engine, jewelry pricing formulas & LocalStorage persistence
│   └── app.js            # Main UI controller, tab switching, modals, POS billing & toast alerts
└── README.md             # Detailed documentation & feature reference
```

---

## 💎 Design Philosophy: Sober, Simple & Aesthetic
* **Sober**: No jarring neon colors or noisy animations. High contrast, refined muted tones, and clean line dividers.
* **Simple**: Workflows are mapped to actual jewelry shop operations (weighing, hallmarking, scrap deduction, billing, and certificates).
* **Aesthetic**: Tailored for luxury fine jewelry boutiques, projecting trust, precision, and craftsmanship.
