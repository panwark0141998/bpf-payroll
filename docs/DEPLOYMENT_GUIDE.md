# BPF Payroll - Vercel, Supabase & Git Live Deployment Guide

This guide details how to deploy **BPF Payroll + Mobile Face Attendance System** to **Vercel** with a **Supabase PostgreSQL** cloud database and push the repository to **Git / GitHub**.

---

## 1. Architecture Overview in Production

```
                                  +------------------------------------+
                                  |         Vercel Deployment          |
                                  |                                    |
  Admin / HR Users -------------> |   /        -> Desktop HR Portal    |
                                  |   /mobile  -> Mobile Attendance    |
  Employees / Tablets ----------> |   /api/*   -> Express Serverless   |
                                  +-----------------+------------------+
                                                    |
                                                    | SSL Database Queries
                                                    v
                                  +------------------------------------+
                                  |         Supabase Cloud             |
                                  |  PostgreSQL 17.6 Database Engine   |
                                  |  - 35 Normalized Tables            |
                                  |  - Session & Transaction Poolers   |
                                  |  - Enterprise Seed Data            |
                                  +------------------------------------+
```

---

## 2. Supabase Cloud Database Configuration

The database schema and enterprise seed data have already been deployed to your Supabase project:
- **Project URL**: `https://llorazdgdoqcxnecizfx.supabase.co`
- **Region**: `ap-northeast-2`
- **Session Pooler (Port 5432, Migrations/DDL)**:
  `postgresql://postgres.llorazdgdoqcxnecizfx:BPFbpf%4099672@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`
- **Transaction Pooler (Port 6543, Serverless Queries)**:
  `postgresql://postgres.llorazdgdoqcxnecizfx:BPFbpf%4099672@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true`

### Default Login Credentials (Seeded):
| Role | Email | Password | Company Code |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@bpfpayroll.com` | `admin123` | `BPF-TECH` |
| **HR Manager** | `hr@bpfpayroll.com` | `hr123` | `BPF-TECH` |
| **Payroll Specialist** | `payroll@bpfpayroll.com` | `payroll123` | `BPF-TECH` |
| **Supervisor** | `supervisor@bpfpayroll.com` | `sup123` | `BPF-TECH` |
| **Employee** | `emp001@bpfpayroll.com` | `emp123` | `BPF-TECH` |

---

## 3. Pushing Code to Git / GitHub

1. Create a new repository on GitHub (e.g. `bpf-payroll`).
2. In your terminal inside `C:\Users\panwa\.gemini\antigravity\scratch\bpf-payroll`, run:
   ```bash
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/bpf-payroll.git
   git branch -M main
   git push -u origin main
   ```

---

## 4. Deploying to Vercel

### Option A: Via Vercel Dashboard (Recommended)
1. Go to [vercel.com/new](https://vercel.com/new).
2. Import your GitHub repository (`bpf-payroll`).
3. Under **Environment Variables**, add the following:

| Key | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres.llorazdgdoqcxnecizfx:BPFbpf%4099672@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres` | Supabase connection string |
| `DATABASE_TRANSACTION_URL` | `postgresql://postgres.llorazdgdoqcxnecizfx:BPFbpf%4099672@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true` | Supabase transaction pooler |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://llorazdgdoqcxnecizfx.supabase.co` | Supabase API endpoint |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_LZMYrdbk-BEKK-v2hnn-Og_1Uv8Ve4I` | Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_cQ0Qfghaq6NhHQuRj9yvkA_W4mO9bIF` | Supabase secret key |
| `JWT_SECRET` | `bpf_super_secret_jwt_access_token_key_2026_x89f` | API token signing key |
| `ENCRYPTION_KEY` | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` | AES-256 biometric encryption key |
| `NODE_ENV` | `production` | Runtime mode |

4. Click **Deploy**. Vercel will run the build command configured in `vercel.json` (`npm run build && node scripts/prepare-deployment.js`) and publish your live application.

### Option B: Via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 5. Live Application URLs

Once deployed to Vercel (e.g., `https://bpf-payroll.vercel.app`):
- **Desktop HR & Payroll ERP**: `https://bpf-payroll.vercel.app/`
- **Mobile Face Attendance Kiosk**: `https://bpf-payroll.vercel.app/mobile`
- **API Health Check**: `https://bpf-payroll.vercel.app/api/health`
- **API Endpoints**: `https://bpf-payroll.vercel.app/api/*`

---

## 6. Running Local Development

To run all apps locally connected to Supabase:
```bash
# Start the central API server (Port 5000)
npm run dev:api

# Start Desktop HR Portal (Port 3000)
npm run dev:desktop

# Start Mobile Face Attendance App (Port 3001)
npm run dev:mobile
```
