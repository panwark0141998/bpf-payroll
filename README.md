# BPF Payroll: Enterprise Payroll & Mobile Face Attendance System

**BPF Payroll** is a production-ready, modular, multi-tenant capable Human Resource Management and Payroll Processing platform paired with an Android Mobile Face Attendance application.

---

## System Overview

1. **Windows Desktop Payroll & HR ERP Application** (`apps/desktop`): Built with Electron + React + TypeScript + Vite. Features a full ERP layout with Left Navigation Sidebar, Top Header with Unit/Company switcher, live Indian Standard Time (IST) clock, interactive KPI Dashboards, and full Employee Master register with multi-tab enrollment modal and sensitive PII masking.
2. **Android Mobile Face Attendance Application** (`apps/mobile`): Built with React + TypeScript + Vite (optimized for native Android webview/PWA). Features instant employee login, active shift indicator, live clock, GPS Geofencing verification (100m radius check), camera viewfinder face biometric capture, and offline synchronization queue.
3. **Central Backend REST API** (`apps/api`): Node.js + Express + TypeScript. Features JWT authentication (access + refresh token rotation), 11 RBAC roles with module- and action-level permissions, dual-engine PostgreSQL connector, and immutable audit trails.
4. **Dual-Engine PostgreSQL Relational Database** (`database/`):
   - **Local Development**: Built-in `@electric-sql/pglite` (Postgres 16 WASM engine persisting to `./data/pglite_db` with zero external service dependencies).
   - **Production / External Cluster**: Full compatibility with external PostgreSQL 14+ via `pg.Pool` by setting `DATABASE_URL`.
   - **Complete Normalized Relational Schema**: 35 tables with foreign keys, check constraints, cascading rules, and indexes.

---

## Monorepo Architecture

```
bpf-payroll/
├── apps/
│   ├── api/                          # Node.js + TypeScript Express REST API
│   │   ├── src/
│   │   │   ├── config/               # App configuration & environment loader
│   │   │   ├── database/             # Dual-engine PostgreSQL connector & runners
│   │   │   ├── middleware/           # JWT verification, RBAC guards, error handling
│   │   │   ├── modules/
│   │   │   │   ├── auth/             # Desktop & Mobile authentication, tokens
│   │   │   │   ├── company/          # Companies, Units, Departments, Designations
│   │   │   │   ├── employee/         # Employee Master CRUD with PII masking
│   │   │   │   ├── reports/          # Live dashboard KPI metrics service
│   │   │   │   └── audit/            # Immutable audit logging service
│   │   │   └── index.ts              # API server entrypoint
│   │   └── test/                     # Automated unit and integration test suite
│   ├── desktop/                      # Windows Desktop ERP Application (Vite + React + TS)
│   │   ├── src/
│   │   │   ├── components/           # Sidebar, Header, Modals, Badges
│   │   │   ├── pages/                # Login, Dashboard, Employee Master
│   │   │   ├── services/             # Axios API client with token interceptor
│   │   │   └── App.tsx
│   │   └── vite.config.ts            # Proxies /api to API server (port 3000)
│   └── mobile/                       # Android Mobile Attendance App (Vite + React + TS)
│       ├── src/
│       │   ├── screens/              # LoginScreen, HomeScreen (Face Punch & GPS)
│       │   ├── services/             # API client & device registration
│       │   └── App.tsx
│       └── vite.config.ts            # Proxies /api to API server (port 3001)
├── database/
│   ├── migrations/                   # 001_initial_schema.sql (35 normalized tables)
│   └── seed/                         # Seed data for Company, 3 Units, 5 Depts, 10 Employees
├── packages/
│   ├── shared-types/                 # TypeScript interfaces for API, Desktop, Mobile
│   └── validation/                   # Shared Zod validation schemas
├── docs/                             # Architecture docs, ERD, API specs
├── .env.example
├── .env
├── package.json                      # Workspaces configuration
└── README.md
```

---

## Test Login Credentials (Development Environment)

| Portal | Role | Username / Email / Code | Password / PIN | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop ERP** | Super Admin | `admin@bpfpayroll.com` | `admin123` | Unrestricted system-wide access |
| **Desktop ERP** | HR Manager | `hr@bpfpayroll.com` | `hr123` | Full HR, employee, & attendance management |
| **Desktop ERP** | Payroll Admin | `payroll@bpfpayroll.com` | `payroll123` | Salary structure & payroll processing |
| **Desktop ERP** | Shift Supervisor | `supervisor@bpfpayroll.com` | `sup123` | Shift rostering & attendance approvals |
| **Mobile App** | Employee (CTO) | `BPF001` or `9820011221` | `1234` or `emp123` | Mobile Face Attendance portal |
| **Mobile App** | Employee (Dev) | `BPF006` or `9820066776` | `1234` or `emp123` | Mobile Face Attendance portal |

*Company Code for all portals:* **`BPF-TECH`**

---

## Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18.0+ (Tested on v24.15.0)
- **npm**: v9.0+ (Tested on v11.12.1)

### 2. Installation
```powershell
# From the bpf-payroll repository root:
npm install
```

### 3. Database Migration & Seeding
```powershell
# Run the 35-table PostgreSQL schema migration:
npm run migrate

# Seed company, units, roles, shifts, leave types, employees, and credentials:
npm run seed
```

### 4. Running the Automated Test Suite
```powershell
npm test
```
All 13 integration tests will run against the embedded PostgreSQL engine, verifying authentication, RBAC authorization, employee filtering, sensitive data masking, and live metric calculations.

### 5. Running the Services
Open separate terminal windows or execute:

```powershell
# Terminal 1: Launch Backend API (Port 5000)
npm run dev:api

# Terminal 2: Launch Windows Desktop ERP Client (Port 3000)
npm run dev:desktop

# Terminal 3: Launch Android Mobile Attendance Client (Port 3001)
npm run dev:mobile
```

- **Desktop ERP**: Visit `http://localhost:3000`
- **Mobile App**: Visit `http://localhost:3001`
- **Backend API**: Running on `http://localhost:5000/api/health`

---

## Deploying to Vercel (Going Live)

The monorepo is fully configured for zero-configuration, unified deployment on Vercel:
- **Desktop ERP Portal**: Served at `/`
- **Mobile Face Attendance Web App**: Served at `/mobile`
- **REST API (Serverless)**: Served at `/api/*`

### Method 1: Deploy with Git (Recommended)

1. Push your changes to GitHub (already pushed to `https://github.com/panwark0141998/bpf-payroll.git`).
2. Log in to [vercel.com](https://vercel.com) and click **"Add New..." > "Project"**.
3. Import the repository **`panwark0141998/bpf-payroll`**.
4. Configure Project Settings:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (Default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. In **Environment Variables**, add:
   - `DATABASE_URL`: `postgresql://postgres.llorazdgdoqcxnecizfx:BPFbpf%4099672@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: `bpf_super_secret_jwt_access_token_key_2026_x89f`
   - `JWT_REFRESH_SECRET`: `bpf_super_secret_jwt_refresh_token_key_2026_z12m`
   - `COOKIE_SECRET`: `bpf_cookie_secure_signer_9921_secret`
   - `ENCRYPTION_KEY`: `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://llorazdgdoqcxnecizfx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: `sb_publishable_LZMYrdbk-BEKK-v2hnn-Og_1Uv8Ve4I`
   - `SUPABASE_SERVICE_ROLE_KEY`: `sb_secret_cQ0Qfghaq6NhHQuRj9yvkA_W4mO9bIF`
6. Click **Deploy**.

### Method 2: Deploy using Vercel CLI

```powershell
# 1. Authenticate with Vercel:
npx vercel login

# 2. Deploy to production:
npx vercel --prod
```

