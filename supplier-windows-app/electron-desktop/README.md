# Levitate3D Supplier Terminal (Option A: Standalone Electron Client)

This is the standalone Windows desktop client for foreign 3D model designers and 3D printing fulfillment operators.

## Security & Architecture Highlights
1. **Zero Public Storefront Access:** The client connects solely to the `/api/v1/supplier/*` backend API endpoints. Any attempt by a supplier credential to browse public storefront or administrative routes triggers an unconditional `404 Not Found`.
2. **PII & Pricing Stripping:** All customer pricing, profit margins, billing information, and sensitive customer contact information are strictly scrubbed by the server before reaching this client.
3. **Hardware Device-Bound Token:** Authentication requires a verified device token issued from the Admin Portal.
4. **WORM Chain of Custody:** Every refined 3D model upload (`.stl` / `.glb`) and status progression computes an immutable SHA-256 hash automatically chained into the PostgreSQL `worm_audit_events` ledger.
5. **Offline Resilient 3D Inspection:** Features an embedded 3D viewer with an automatic offline canvas wireframe fallback to inspect center-of-mass balance, magnet socket dimensions (18.2mm x 6.5mm), and internal LED wiring channels.

---

## Quick Start (Run Locally)

### 1-Click Startup
Double-click `start.bat` in this folder, or execute via terminal:

```powershell
cd supplier-windows-app/electron-desktop
npm install
npm start
```

### Compile to Standalone Windows `.exe` Installer
Double-click `build-exe.bat`, or run:

```powershell
cd supplier-windows-app/electron-desktop
npm run build:exe
```
The standalone installer executable will be placed in `supplier-windows-app/electron-desktop/dist/`.

---

## Default Seeded Credentials
- **Operator Email:** `factory@3dprint-supplier.cn`
- **Password:** `factory123`
- **Device Token:** `WIN-APP-DEMO-HARDWARE-TOKEN` (or generate a custom token at `/admin`)
