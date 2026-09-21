# BPF Payroll - REST API Documentation

Base URL: `http://localhost:5000/api`

## Authentication & Security

All protected endpoints require an `Authorization` header with a Bearer token:
```
Authorization: Bearer <access_token>
```

### Response Envelope
Every API response adheres to the standardized envelope:
```json
{
  "success": true,
  "message": "Optional message",
  "data": { ... }
}
```

Error response envelope:
```json
{
  "success": false,
  "message": "Validation failed / Permission denied",
  "code": "ERROR_CODE",
  "errors": { "field": ["details"] }
}
```

---

## Endpoints

### 1. Health & Status
- **`GET /health`**
  - Public
  - Returns API status, version, and server timestamp.

### 2. Authentication
- **`POST /auth/login`**
  - Desktop login for Admin / HR / Payroll / Supervisors.
  - Body:
    ```json
    {
      "companyCode": "BPF-TECH",
      "usernameOrEmail": "admin@bpfpayroll.com",
      "password": "admin123",
      "rememberMe": true
    }
    ```
  - Response: `{ user: { id, fullName, roles, permissions, ... }, tokens: { accessToken, refreshToken, expiresIn } }`

- **`POST /auth/mobile-login`**
  - Mobile login for employees.
  - Body:
    ```json
    {
      "companyCode": "BPF-TECH",
      "employeeCodeOrMobile": "BPF001",
      "pinOrPassword": "1234",
      "deviceId": "DEV-AND-9912",
      "deviceModel": "Pixel 8",
      "osVersion": "Android 14",
      "appVersion": "1.0.0"
    }
    ```
  - Automatically registers/approves employee device in the `devices` table.

- **`POST /auth/refresh`**
  - Rotates expired access token.
  - Body: `{ "refreshToken": "<token>" }`

- **`GET /auth/me`**
  - Protected.
  - Returns currently authenticated user profile, roles, and granular permission dictionary.

- **`POST /auth/logout`**
  - Protected.
  - Clears refresh cookies and session tokens.

### 3. Companies & Units
- **`GET /companies`** (`company:view`)
  - List all registered companies.
- **`GET /companies/:id`** (`company:view`)
  - Detailed company master data.
- **`PUT /companies/:id`** (`company:edit`)
  - Update company name, address, GSTIN, PAN, TAN, timezone, or currency.
- **`GET /companies/:companyId/units`** (`unit:view`)
  - List operating units under company with active employee counts.
- **`POST /companies/:companyId/units`** (`unit:create`)
  - Register new operating unit with GPS coordinates and Geofence radius.
- **`PUT /units/:id`** (`unit:edit`)
  - Update unit coordinates, address, geofence radius, or active status.
- **`GET /departments`**
  - List departments with active headcount.
- **`GET /designations`**
  - List employee designations and grades.

### 4. Employee Master
- **`GET /employees`** (`employee:view`)
  - Filterable & searchable employee list.
  - Query parameters:
    - `unitId` (UUID)
    - `departmentId` (UUID)
    - `status` (`ACTIVE`, `PROBATION`, `EXITED`)
    - `search` (Search by code, full name, email, or mobile)
    - `page` (Default: 1)
    - `pageSize` (Default: 20)
  - PII Masking: If the requester lacks sensitive HR/Payroll permissions, bank account numbers, PAN numbers, Aadhaar references, and salary figures are automatically masked.
- **`GET /employees/:id`** (`employee:view`)
  - Full employee dossier, active salary structure, assigned shift, and manager details.
- **`POST /employees`** (`employee:create`)
  - Creates Employee Master record, creates initial salary structure, assigns default shift, and credits annual leave balances in an ACID transaction.
- **`PUT /employees/:id`** (`employee:edit`)
  - Update employee biographical, contact, or statutory details.
- **`POST /employees/:id/deactivate`** (`employee:delete`)
  - Deactivates employee with exit date and exit reason, updating status to `EXITED`.

### 5. Live Dashboard & Metrics
- **`GET /dashboard/metrics`**
  - Real-time headcount, present/absent/leave counts, late arrivals, missing punches, department headcount breakdown, and 7-day attendance trends.

### 6. Audit Logs
- **`GET /audit/logs`** (`audit:view`)
  - Immutable audit trail of creations, updates, logins, and status alterations with old and new values.
