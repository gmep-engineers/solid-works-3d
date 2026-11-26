# Levitate3D — Custom Magnetic Levitating & Illuminated 3D Statue Platform

> Production-ready, full-stack e-commerce and custom 3D manufacturing platform where users generate AI 3D models via the **Tripo3D API** (from photos, sketches, or text prompts), request human 3D designer refinements, and order a physical 3D-printed statue engineered to levitate and illuminate on a custom magnetic floating base with optional wireless internal embedded LEDs.

---

## 1. System Architecture & Pillars

```
                     ┌──────────────────────────────────────────────┐
                     │            PUBLIC / CUSTOMER / ADMIN         │
                     │  Next.js 14 Web (Storefront, Studio, Admin)  │
                     │   + Three.js Interactive Levitation Viewer   │
                     │   (Future iOS Swift / Android Kotlin Apps)   │
                     └──────────────────────┬───────────────────────┘
                                            │ JWT / Bearer
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        HEADLESS REST BACKEND (/api/v1/...)                             │
│                  FastAPI / NestJS • OpenAPI 3.0 Specs at /api/v1/docs                  │
├──────────────────┬──────────────────┬─────────────────────┬────────────────────────────┤
│  Tripo3D Engine  │  Stripe Gateway  │ WORM Security Engine│  MinIO / S3 Object Lock    │
│  (Text/Img/Draw) │ (PaymentIntents) │ (SHA-256 Chaining)  │ (Immutable .glb/.stl vault)│
└──────────────────┴──────────────────┴──────────┬──────────┴────────────────────────────┘
                                                 │
                                 ┌───────────────┴───────────────┐
                                 │ PostgreSQL 16 Immutable Table │
                                 │ worm_audit_events (NO UPDATE) │
                                 └───────────────────────────────┘
                                                 ▲
                                                 │ Scoped /api/v1/supplier/* Only
                                                 │ (404 on any storefront route)
                     ┌───────────────────────────┴──────────────────┐
                     │          ISOLATED SUPPLIER WORKSTATIONS      │
                     │   Standalone Windows Desktop Client (.exe)   │
                     │    • C# .NET 8 WPF / Electron Desktop Client │
                     │    • Hardware Device-Token Authenticated     │
                     │    • Strictly Stripped of Customer PII/Price │
                     └──────────────────────────────────────────────┘
```

### Architectural Pillars
1. **API-First / Headless Backend (`/api/v1/...`):** Complete decoupled REST/JSON backend with stateless JWT + refresh token authentication. OpenAPI/Swagger auto-documentation at `/api/v1/docs` enables instant client SDK generation for **iOS (Swift / Flutter)** and **Android**.
2. **Ultra-Simple 3-Step Customer Studio:** Single-workspace friction-free customer ordering experience (`Create -> Customize -> Checkout`) with Three.js 3D viewer (dynamic magnetic levitation floating animation and wireless inductive internal LED illumination preview).
3. **Strict Supplier Isolation (Zero Web Access):** Foreign 3D designers and print operators have zero access to the public storefront, pricing, profit margins, or customer PII. They interact exclusively through the standalone **Windows Desktop Client** communicating over the scoped `/api/v1/supplier/...` API. Any web route accessed with a supplier token returns `404 Not Found`.
4. **WORM (Write-Once-Read-Many) Legal & Transaction Audit Ledger:** Append-only, tamper-evident cryptographic SHA-256 chained ledger with PostgreSQL database-level `BEFORE UPDATE OR DELETE` triggers throwing exceptions on any attempted modification.

---

## 2. Directory Structure

```
├── backend/                     # Headless REST API Backend (NestJS / TypeScript)
│   ├── src/
│   │   ├── config/              # Centralized environment configuration
│   │   ├── database/            # PostgreSQL pool, schema.sql, WORM triggers, seed.ts
│   │   ├── modules/
│   │   │   ├── auth/            # JWT, refresh token, role & supplier isolation guards
│   │   │   ├── worm/            # Cryptographic SHA-256 hash chaining & verification
│   │   │   ├── storage/         # MinIO / S3 Object Lock compliance storage adapter
│   │   │   ├── tripo3d/         # Tripo3D API wrapper (Text, Image, Sketch to 3D)
│   │   │   ├── orders/          # Customization options, pricing & specs calculator
│   │   │   ├── payments/        # Stripe PaymentIntent, webhook & WORM payment lock
│   │   │   ├── tracking/        # 6-step visual milestone pipeline & carrier tracking
│   │   │   ├── share/           # Post-delivery Social Share Kit & OpenGraph metadata
│   │   │   ├── supplier/        # Isolated supplier API (strictly stripped of PII/margins)
│   │   │   └── admin/           # Financial analytics, COGS, margins & WORM explorer
│   │   ├── main.ts              # Server bootstrap with Swagger OpenAPI at /api/v1/docs
│   │   └── Dockerfile
│   └── package.json
│
├── web/                         # Customer & Admin Web Application (Next.js 14)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Customer Studio (Create -> Customize -> Checkout)
│   │   │   ├── tracking/[id]/   # Live milestone tracker with 3D model viewer
│   │   │   ├── showcase/[token]/# Post-delivery social share kit & 360 turntable
│   │   │   ├── admin/page.tsx   # Real-time revenue, COGS, margins, device tokens
│   │   │   └── admin/worm/      # WORM cryptographic ledger verification explorer
│   │   ├── components/
│   │   │   ├── 3d/ModelViewer.tsx # Interactive Three.js levitation & lighting viewer
│   │   │   └── studio/          # StepCreate, StepCustomize, StepCheckout components
│   │   └── lib/api.ts           # Central API client
│   └── package.json
│
├── supplier-windows-app/        # Isolated Windows Desktop Clients
│   ├── electron-desktop/        # Electron standalone client with Three.js viewer
│   │   ├── src/                 # main.js, preload.js, renderer UI
│   │   └── package.json         # Packaged with electron-builder to Windows .exe
│   └── csharp-net8-wpf/         # Complete C# .NET 8 WPF Desktop Client source code
│       ├── Levitate3D.Supplier.csproj
│       ├── MainWindow.xaml / .cs# Technical 3D spec inspector & stage updater
│       ├── Services/            # Scoped SupplierApiClient.cs
│       └── README.md            # dotnet publish single-file .exe compilation guide
│
├── docker-compose.yml           # One-command orchestration (Postgres, MinIO, Backend, Web)
├── .env.example                 # Comprehensive environment variable definitions
└── README.md                    # Project documentation
```

---

## 3. Quick Start with Docker Compose

Run the entire platform (PostgreSQL with WORM triggers, MinIO with Object Lock, NestJS REST API, and Next.js Frontend) with a single command:

```powershell
# 1. Clone or navigate to the workspace
cd "c:\Users\gzhou\.antigravity\simplized 3D service"

# 2. Copy environment file
cp .env.example .env

# 3. Start all services
docker-compose up --build
```

### Services Deployed
- **Customer & Admin Storefront:** `http://localhost:3000`
- **Headless Backend API:** `http://localhost:4000`
- **Interactive Swagger / OpenAPI Docs:** `http://localhost:4000/api/v1/docs`
- **MinIO Storage & Object Lock Console:** `http://localhost:9001` (Credentials: `minioadmin` / `minioadmin`)
- **PostgreSQL 16:** `localhost:5432` (Database: `levitate3d`, User: `postgres`)

---

## 4. Running the Supplier Windows Desktop App

Foreign suppliers interact exclusively through the standalone Windows desktop client. Two production options are provided:

### Option A: Electron Desktop Client (Cross-Platform Standalone)
```powershell
cd supplier-windows-app/electron-desktop
npm install
npm start
```
To package as an installer `.exe`:
```powershell
npm run build:exe
```

### Option B: C# .NET 8 WPF Client (Single-File Standalone `.exe`)
```powershell
cd supplier-windows-app/csharp-net8-wpf
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o ./publish
```
The compiled executable will be located at `./publish/Levitate3D.Supplier.exe`.

### Supplier Credentials (Demo / Seeded)
- **Email:** `factory@3dprint-supplier.cn`
- **Password:** `factory123`
- **Hardware Device Token:** `WIN-APP-DEMO-HARDWARE-TOKEN` (or generate a fresh one from `/admin`)

---

## 5. WORM (Write-Once-Read-Many) Cryptographic Specification

### PostgreSQL Trigger Protection
The `worm_audit_events` table enforces an unconditional trigger:
```sql
CREATE OR REPLACE FUNCTION prevent_worm_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'WORM_VIOLATION: Records in worm_audit_events are immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_worm_audit_mutation
BEFORE UPDATE OR DELETE ON worm_audit_events
FOR EACH ROW EXECUTE FUNCTION prevent_worm_audit_mutation();
```

### Cryptographic Hash Chaining
Each event hash is computed deterministically:
$$\text{event\_hash} = \text{SHA-256}(\text{previous\_event\_hash} \parallel \text{sequence\_num} \parallel \text{timestamp} \parallel \text{actor\_role} \parallel \text{actor\_id} \parallel \text{order\_id} \parallel \text{event\_type} \parallel \text{artifact\_sha256} \parallel \text{canonical\_payload\_json})$$

### Chain Verification Endpoint
`GET /api/v1/admin/worm/verify/{order_id}` recomputes the entire chain from Genesis block (`0000...0000`) to the latest block and verifies zero mutations or tampering.

---

## 6. Core API Endpoint Reference

| Method | Endpoint | Description | Auth Scope |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Customer registration | Public |
| `POST` | `/api/v1/auth/login` | Email/password login | Public |
| `POST` | `/api/v1/generations/tripo` | Initiate 3D model synthesis (Text, Image, Sketch) | Customer |
| `GET` | `/api/v1/generations/tripo/:id/status` | Poll status & retrieve `.glb` model | Customer |
| `POST` | `/api/v1/orders` | Create custom order with base & LED options | Customer |
| `POST` | `/api/v1/orders/:id/checkout` | Process Stripe checkout & record WORM lock | Customer |
| `GET` | `/api/v1/orders/:id/tracking` | 6-step visual milestone pipeline & carrier tracking | Customer |
| `GET` | `/api/v1/orders/:id/share-kit` | Post-delivery 360 turntable, OG tags & share links | Customer |
| `POST` | `/api/v1/supplier/auth` | Hardware device-token login | Supplier Only |
| `GET` | `/api/v1/supplier/jobs` | Queue (Stripped of customer pricing & PII) | Supplier Only |
| `POST` | `/api/v1/supplier/jobs/:id/upload-refined` | Upload calibrated `.stl`/`.glb` model + WORM hash | Supplier Only |
| `PATCH` | `/api/v1/supplier/jobs/:id/status` | Advance production & enter carrier tracking | Supplier Only |
| `GET` | `/api/v1/admin/analytics/financials` | Revenue, COGS, supplier payouts & net margins | Admin Only |
| `GET` | `/api/v1/admin/worm/verify/:orderId` | Cryptographic SHA-256 hash chain verification | Admin Only |
