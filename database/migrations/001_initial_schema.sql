-- BPF Payroll - Complete Normalized Database Schema
-- Compatible with PostgreSQL 14+ and @electric-sql/pglite WASM PostgreSQL (gen_random_uuid() is native)

-- ============================================================================
-- 1. COMPANIES & UNITS
-- ============================================================================
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    gstin VARCHAR(20),
    pan VARCHAR(20),
    tan VARCHAR(20),
    cin VARCHAR(30),
    phone VARCHAR(20),
    email VARCHAR(100),
    logo_url TEXT,
    financial_year VARCHAR(20) DEFAULT '2026-2027',
    payroll_cycle VARCHAR(50) DEFAULT 'MONTHLY',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geofence_radius_meters INTEGER NOT NULL DEFAULT 100,
    geofence_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_company_unit_code UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_company_dept_code UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS designations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    grade VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_company_desig_code UNIQUE (company_id, code)
);

-- ============================================================================
-- 2. RBAC & USERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    CONSTRAINT uq_module_action UNIQUE (module, action)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED')),
    employee_id UUID,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ============================================================================
-- 3. EMPLOYEES & DOCUMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    designation_id UUID NOT NULL REFERENCES designations(id) ON DELETE RESTRICT,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    biometric_face_id VARCHAR(100),
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    father_husband_name VARCHAR(255),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    marital_status VARCHAR(20) DEFAULT 'SINGLE' CHECK (marital_status IN ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED')),
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    emergency_contact VARCHAR(50),
    date_of_joining DATE NOT NULL,
    grade VARCHAR(50),
    employment_type VARCHAR(50) DEFAULT 'FULL_TIME' CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN')),
    reporting_manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    work_status VARCHAR(50) DEFAULT 'OFFICE' CHECK (work_status IN ('OFFICE', 'REMOTE', 'HYBRID', 'FIELD')),
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    ifsc_code VARCHAR(20),
    pan_number VARCHAR(20),
    aadhaar_ref VARCHAR(50),
    uan_number VARCHAR(50),
    esic_number VARCHAR(50),
    pf_applicable BOOLEAN DEFAULT TRUE,
    esic_applicable BOOLEAN DEFAULT TRUE,
    pt_applicable BOOLEAN DEFAULT TRUE,
    tds_applicable BOOLEAN DEFAULT FALSE,
    salary_structure_type VARCHAR(50) DEFAULT 'STANDARD',
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PROBATION', 'SUSPENDED', 'EXITED')),
    exit_date DATE,
    exit_reason TEXT,
    face_enrolled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Foreign key link back from users to employees
ALTER TABLE users ADD CONSTRAINT fk_user_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('AADHAAR', 'PAN', 'BANK_PROOF', 'JOINING_LETTER', 'APPOINTMENT_LETTER', 'PHOTO', 'RESUME', 'OTHER')),
    document_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. FACE ENROLLMENT & DEVICE REGISTRATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS face_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    encrypted_embedding TEXT NOT NULL,
    embedding_dimension INTEGER NOT NULL DEFAULT 128,
    quality_score REAL NOT NULL,
    model_version VARCHAR(50) DEFAULT 'mediapipe-facemesh-v1',
    device_info TEXT,
    enrolled_by UUID REFERENCES users(id),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    consent_obtained BOOLEAN DEFAULT TRUE,
    consent_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED', 'REVOKED'))
);

CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_model VARCHAR(100),
    os_version VARCHAR(50),
    app_version VARCHAR(50),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'DISABLED', 'BLOCKED')),
    approved_by UUID REFERENCES users(id),
    CONSTRAINT uq_emp_device UNIQUE (employee_id, device_id)
);

-- ============================================================================
-- 5. SHIFTS & ROSTERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    grace_period_minutes INTEGER DEFAULT 15,
    late_threshold_minutes INTEGER DEFAULT 30,
    early_exit_threshold_minutes INTEGER DEFAULT 30,
    half_day_work_hours REAL DEFAULT 4.0,
    full_day_work_hours REAL DEFAULT 8.0,
    break_duration_minutes INTEGER DEFAULT 60,
    overtime_min_minutes INTEGER DEFAULT 60,
    night_shift BOOLEAN DEFAULT FALSE,
    cross_midnight BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_company_shift_code UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS shift_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE,
    assigned_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. ATTENDANCE & SYNC QUEUE
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
    attendance_date DATE NOT NULL,
    in_time TIME,
    out_time TIME,
    in_timestamp TIMESTAMP WITH TIME ZONE,
    out_timestamp TIMESTAMP WITH TIME ZONE,
    total_work_hours REAL DEFAULT 0.0,
    overtime_hours REAL DEFAULT 0.0,
    late_minutes INTEGER DEFAULT 0,
    early_exit_minutes INTEGER DEFAULT 0,
    status VARCHAR(30) NOT NULL CHECK (status IN ('PRESENT', 'HALF_DAY', 'ABSENT', 'LEAVE', 'HOLIDAY', 'WEEKLY_OFF', 'LATE', 'EARLY_EXIT', 'OVERTIME', 'MISSING_PUNCH')),
    in_latitude DOUBLE PRECISION,
    in_longitude DOUBLE PRECISION,
    in_gps_accuracy REAL,
    out_latitude DOUBLE PRECISION,
    out_longitude DOUBLE PRECISION,
    out_gps_accuracy REAL,
    in_device_id VARCHAR(255),
    out_device_id VARCHAR(255),
    face_verified BOOLEAN DEFAULT FALSE,
    face_similarity_score REAL,
    source VARCHAR(30) DEFAULT 'MOBILE_APP' CHECK (source IN ('MOBILE_APP', 'DESKTOP_MANUAL', 'BIOMETRIC_DEVICE', 'SYSTEM_GENERATED')),
    sync_status VARCHAR(20) DEFAULT 'SYNCED' CHECK (sync_status IN ('SYNCED', 'PENDING_SYNC', 'FAILED_SYNC')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_emp_attendance_date UNIQUE (employee_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS attendance_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_event_id VARCHAR(100) UNIQUE NOT NULL,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    punch_type VARCHAR(10) NOT NULL CHECK (punch_type IN ('IN', 'OUT')),
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    gps_accuracy REAL,
    device_id VARCHAR(255) NOT NULL,
    face_similarity_score REAL,
    sync_status VARCHAR(20) DEFAULT 'PENDING' CHECK (sync_status IN ('PENDING', 'PROCESSED', 'REJECTED')),
    error_message TEXT,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS attendance_regularization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    correction_type VARCHAR(50) NOT NULL CHECK (correction_type IN ('MISSING_IN', 'MISSING_OUT', 'WRONG_PUNCH', 'SHIFT_CORRECTION', 'FULL_ATTENDANCE')),
    requested_in_time TIME,
    requested_out_time TIME,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    approved_by UUID REFERENCES users(id),
    approval_remark TEXT,
    original_attendance_snapshot JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. LEAVE, HOLIDAYS & OVERTIME
-- ============================================================================
CREATE TABLE IF NOT EXISTS leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    days_allowed_per_year REAL NOT NULL DEFAULT 12,
    is_paid BOOLEAN DEFAULT TRUE,
    carry_forward_max INTEGER DEFAULT 0,
    encashable BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_company_leave_code UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    total_credited REAL NOT NULL DEFAULT 0,
    used REAL NOT NULL DEFAULT 0,
    pending REAL NOT NULL DEFAULT 0,
    balance REAL NOT NULL DEFAULT 0,
    CONSTRAINT uq_emp_leave_year UNIQUE (employee_id, leave_type_id, year)
);

CREATE TABLE IF NOT EXISTS leave_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    days_count REAL NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    reviewed_by UUID REFERENCES users(id),
    review_remarks TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    holiday_type VARCHAR(50) DEFAULT 'NATIONAL' CHECK (holiday_type IN ('NATIONAL', 'FESTIVAL', 'OPTIONAL', 'REGIONAL')),
    is_paid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS overtime (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    shift_id UUID REFERENCES shifts(id),
    normal_hours REAL NOT NULL,
    ot_hours REAL NOT NULL,
    ot_rate REAL NOT NULL,
    ot_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. LOANS & ADVANCES
-- ============================================================================
CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    loan_type VARCHAR(50) DEFAULT 'PERSONAL',
    principal_amount NUMERIC(12, 2) NOT NULL,
    monthly_installment NUMERIC(12, 2) NOT NULL,
    total_installments INTEGER NOT NULL,
    paid_installments INTEGER DEFAULT 0,
    outstanding_balance NUMERIC(12, 2) NOT NULL,
    start_month VARCHAR(7) NOT NULL, -- Format YYYY-MM
    end_month VARCHAR(7) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'CANCELLED', 'PAUSED')),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    recovery_month VARCHAR(7) NOT NULL, -- Format YYYY-MM
    deducted_amount NUMERIC(12, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'APPROVED' CHECK (status IN ('PENDING', 'APPROVED', 'RECOVERED', 'CANCELLED')),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. SALARY STRUCTURES, RULES & STATUTORY SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS salary_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    component_type VARCHAR(20) NOT NULL CHECK (component_type IN ('EARNING', 'DEDUCTION')),
    is_taxable BOOLEAN DEFAULT TRUE,
    is_statutory BOOLEAN DEFAULT FALSE,
    calculation_type VARCHAR(20) DEFAULT 'FIXED' CHECK (calculation_type IN ('FIXED', 'PERCENTAGE', 'FORMULA')),
    formula_expression TEXT,
    display_order INTEGER DEFAULT 0,
    CONSTRAINT uq_company_component_code UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS employee_salary_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    effective_from DATE NOT NULL,
    effective_to DATE,
    ctc_annual NUMERIC(12, 2) NOT NULL,
    gross_monthly NUMERIC(12, 2) NOT NULL,
    basic NUMERIC(12, 2) NOT NULL,
    hra NUMERIC(12, 2) NOT NULL DEFAULT 0,
    conveyance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    special_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    medical_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    other_allowances NUMERIC(12, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS statutory_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('PF', 'ESI', 'PT', 'TDS')),
    applicable_state VARCHAR(100) DEFAULT 'ALL',
    employee_rate REAL NOT NULL,
    employer_rate REAL NOT NULL,
    wage_ceiling NUMERIC(12, 2) DEFAULT 0,
    min_eligibility_wage NUMERIC(12, 2) DEFAULT 0,
    rule_formula TEXT,
    effective_from DATE NOT NULL,
    effective_to DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 10. PAYROLL ENGINE & APPROVALS
-- ============================================================================
CREATE TABLE IF NOT EXISTS payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    month_year VARCHAR(7) NOT NULL, -- e.g. 2026-09
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    attendance_cutoff DATE NOT NULL,
    total_working_days INTEGER NOT NULL,
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ATTENDANCE_LOCKED', 'PAYROLL_PROCESSING', 'PENDING_APPROVAL', 'APPROVED', 'LOCKED', 'REOPENED')),
    processed_at TIMESTAMP WITH TIME ZONE,
    locked_at TIMESTAMP WITH TIME ZONE,
    locked_by UUID REFERENCES users(id),
    CONSTRAINT uq_company_period UNIQUE (company_id, unit_id, month_year)
);

CREATE TABLE IF NOT EXISTS payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE RESTRICT,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    working_days INTEGER NOT NULL,
    present_days REAL NOT NULL DEFAULT 0,
    paid_leaves REAL NOT NULL DEFAULT 0,
    unpaid_leaves REAL NOT NULL DEFAULT 0,
    lop_days REAL NOT NULL DEFAULT 0,
    payable_days REAL NOT NULL DEFAULT 0,
    overtime_hours REAL NOT NULL DEFAULT 0,
    earned_basic NUMERIC(12, 2) NOT NULL,
    earned_hra NUMERIC(12, 2) NOT NULL DEFAULT 0,
    earned_conveyance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    earned_special_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    earned_other_allowances NUMERIC(12, 2) NOT NULL DEFAULT 0,
    earned_overtime NUMERIC(12, 2) NOT NULL DEFAULT 0,
    bonus_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    incentives_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    gross_earnings NUMERIC(12, 2) NOT NULL,
    pf_employee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    pf_employer NUMERIC(12, 2) NOT NULL DEFAULT 0,
    esic_employee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    esic_employer NUMERIC(12, 2) NOT NULL DEFAULT 0,
    professional_tax NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tds_deduction NUMERIC(12, 2) NOT NULL DEFAULT 0,
    loan_deduction NUMERIC(12, 2) NOT NULL DEFAULT 0,
    advance_deduction NUMERIC(12, 2) NOT NULL DEFAULT 0,
    lop_deduction NUMERIC(12, 2) NOT NULL DEFAULT 0,
    other_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_deductions NUMERIC(12, 2) NOT NULL,
    net_salary NUMERIC(12, 2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PROCESSING', 'PAID', 'ON_HOLD')),
    payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_period_employee UNIQUE (payroll_period_id, employee_id)
);

CREATE TABLE IF NOT EXISTS payroll_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_id UUID NOT NULL REFERENCES payroll(id) ON DELETE CASCADE,
    component_name VARCHAR(100) NOT NULL,
    component_code VARCHAR(50) NOT NULL,
    component_type VARCHAR(20) NOT NULL CHECK (component_type IN ('EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION')),
    amount NUMERIC(12, 2) NOT NULL,
    calculation_basis TEXT
);

CREATE TABLE IF NOT EXISTS payroll_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL CHECK (stage IN ('DRAFT', 'CHECKED', 'SUBMITTED', 'APPROVED', 'LOCKED', 'REOPENED')),
    actor_id UUID NOT NULL REFERENCES users(id),
    comments TEXT,
    acted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salary_slips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_id UUID UNIQUE NOT NULL REFERENCES payroll(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL,
    slip_number VARCHAR(100) UNIQUE NOT NULL,
    file_path TEXT,
    net_pay_in_words TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 11. AUDIT TRAILS, NOTIFICATIONS & SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    record_id VARCHAR(100),
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    device_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    read BOOLEAN DEFAULT FALSE,
    link_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR HIGH PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_employees_comp_unit ON employees(company_id, unit_id);
CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON attendance(employee_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_unit_date ON attendance(unit_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_payroll_period_emp ON payroll(payroll_period_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_user_mod ON audit_logs(user_id, module, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_leave_emp_dates ON leave_applications(employee_id, from_date, to_date);
CREATE INDEX IF NOT EXISTS idx_shift_emp_dates ON shift_assignments(employee_id, start_date, end_date);
