# TitanForge 3D - Metal Additive Manufacturing & Quoting Web Platform

An enterprise web application for 3D metal printing (DMLS / SLM powder bed fusion) with automated CAD model geometry analysis, printability diagnostics, instant pricing, secondary CNC machining configuration, user order tracking, and an admin production portal.

---

## 🚀 Key Modules & Architecture

### 1. User Management, Credentials & Digital Wallet
- **Dual Role Authorization**:
  - `General User` (Customer): Upload CAD models, inspect 3D geometry & DFM diagnostics, select metal alloys, configure surface finishes & CNC machining services, receive instant quotes, pay using their Digital Wallet or Credit Card, and track order milestones in real time.
  - `Admin` (Production Engineer / Operator): Oversee the manufacturing queue, inspect uploaded customer models, advance orders through production stages, assign carrier tracking numbers (FedEx / UPS), add technician telemetry notes, and review platform metrics.
- **Account & Credentials Management**:
  - Dedicated **"Account & Wallet"** tab (`/account`):
    - Update Personal Credentials: Full Name, Company / Organization, Phone Number, and Default Delivery Address.
    - Security Credentials: Change and update account password.
- **Digital Wallet & Credit Card Refill**:
  - Live Wallet balance visible across the application in the navigation bar.
  - **Refill Modal**: Refill using Credit Card (Cardholder Name, Card Number, Expiration MM/YY, CVV) with quick presets (\$250, \$500, \$1,000, \$2,500, or custom amounts).
  - Itemized transaction ledger tracking all refills (CREDIT) and manufacturing order deductions (DEBIT).
  - Seamless checkout integration: Pay directly from the pre-funded wallet or credit card.

### 2. My Projects & Uploaded Models Dashboard
- Dedicated **"My Projects"** tab:
  - Catalog of all SolidWorks models (`.sldprt`) and CAD files uploaded by the user.
  - View model volume ($cm^3$), dimensions ($X \times Y \times Z$ mm), surface area ($cm^2$), and automated DFM status (PASS, WARNING, FAIL).
  - Track how many quotes and orders were placed for each project, with a 1-click **"Open 3D Viewer & Quote"** or **"Track Order"** button.

### 2. CAD Geometry Engine & DFM Diagnostics
- **Format Support**:
  - Native SolidWorks parts (`.sldprt`, `.sldasm`)
  - Standard CAD interchange formats (`.step`, `.stp`, `.iges`)
  - Additive mesh formats (`.stl`, `.obj`, `.3mf`)
- **Automated Geometry Analysis**:
  - Exact part volume calculation ($cm^3$ and $mm^3$)
  - Surface area ($cm^2$) and bounding box envelope ($X \times Y \times Z$ mm)
  - Watertight / manifold mesh integrity verification
  - **Thin Wall & Thin Layer Detection**: Raycasting along internal negative surface normals to detect regions thinner than the metal laser sintering limit ($<0.80\text{ mm}$ warning, $<0.40\text{ mm}$ rejection)
  - Color-coded 3D warning markers overlaid directly on the model in the interactive WebGL viewer.

### 3. Interactive 3D WebGL Viewer (Three.js)
- 360° orbit, pan, and zoom controls.
- Dynamic PBR metallic material rendering matching the selected alloy (Titanium, Stainless Steel, Aluminum, Inconel, Copper).
- Bounding box envelope cage and wireframe tessellation toggle.
- Thin-wall warning heatmap markers indicating exact 3D coordinates of thin features.

### 4. Metal Alloys & Instant Quoting Engine
- **Supported Metal Alloys**:
  - Titanium Ti-6Al-4V Grade 5 (Aerospace / High strength)
  - Stainless Steel 316L (Corrosion resistant / Marine & Food)
  - Aluminum AlSi10Mg (Lightweight / Thermal conductivity)
  - Inconel 718 Nickel Superalloy (High temperature >700°C)
  - Stainless Steel 17-4 PH (Precipitation hardened)
  - Copper Alloy CuNi2SiCr (Electrical & Thermal dissipation)
- **Secondary Machining & Post-Processing Services**:
  - *Surfacing*: As-Printed Glass Bead Blast, Vibratory Tumble Polish, Electro-Chemical Polish, Optical Mirror Hand Polish.
  - *CNC Machining*: Precision Datum Face Milling (flatness within 0.02mm), Thread Tapping (M3 - M12 / 1/4"-20), H7 Bore Reaming.
  - *Baseplate Separation*: Wire EDM precision cut-off.
  - *Thermal Heat Treatment*: Vacuum Stress Relief, Hot Isostatic Pressing (HIP 99.9% density), Solution Annealing & Aging.
- **Lead Time & Shipping**:
  - Standard Production (8-10 Business Days)
  - Expedited Priority (4-6 Business Days)
  - Emergency Rush (2-3 Business Days)
- **Batch Volume Discounts**: Real-time tiered pricing discounts up to 32% for production volumes.

### 5. Real-Time Order Tracking Module
- Visual 8-stage production timeline stepper:
  1. `Order Placed` (DFM pre-screening confirmed)
  2. `CAM / Slicing` (Laser toolpath & recoater clearance generated)
  3. `Laser Sintering` (DMLS powder bed fusion in build chamber)
  4. `Stress Relief & HIP` (High-vacuum furnace thermal cycle)
  5. `Secondary Machining` (Wire EDM baseplate separation, CNC face milling, thread tapping)
  6. `CMM Inspection` (Coordinate measuring machine dimensional scan)
  7. `Shipped` (Packaged and handed to carrier with live tracking number)
  8. `Delivered` (Signed for and received)
- Full production log history with timestamps, technician names, and detailed telemetry notes.

### 6. Admin Production Portal
- Filterable order queue (All, Submitted, In Production, Shipped, Delivered).
- Interactive stage transition modal: select target stage, enter technician notes, assign carrier & tracking number.
- Platform KPIs: Total orders, active printing jobs, total revenue, processed models.
- User management directory with order counts and roles.

---

## 🛠️ Running the Application

### 1. Backend Server (FastAPI)
The backend runs on Python and serves both the REST API and the compiled React frontend:
```bash
python backend/main.py
```
Server is active at: `http://127.0.0.1:8000`

### 2. Frontend Development Server (Optional)
If you want to run the Vite dev server with Hot Module Replacement (HMR):
```bash
cd frontend
npm run dev
```
Development UI runs at: `http://localhost:5173` (proxied to port 8000)

---

## 🔑 Pre-Seeded Accounts (1-Click Demo Available)

| Role | Email | Password | Description |
|---|---|---|---|
| **Admin** | `admin@metalprint.com` | `admin123` | Chief Production Officer with order processing & stage controls |
| **Customer** | `engineer@aerocad.com` | `password123` | Aerospace Engineer with CAD upload, quoting, and active order tracking |
