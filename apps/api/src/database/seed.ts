import bcrypt from 'bcryptjs';
import { db } from './db.js';

export async function runSeed() {
  console.log('====================================================');
  console.log('  SEEDING BPF PAYROLL ENTERPRISE DATA');
  console.log('====================================================');

  await db.transaction(async (tx) => {
    // 1. Company
    console.log('[Seed] Inserting Company...');
    const compRes = await tx.query(
      `INSERT INTO companies (code, name, legal_name, address, gstin, pan, tan, cin, phone, email, financial_year, payroll_cycle, timezone, currency, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id;`,
      [
        'BPF-TECH',
        'BPF Technologies Pvt Ltd',
        'BPF Technologies Private Limited',
        'Tower B, 7th Floor, Mindspace Tech Park, Powai, Mumbai, Maharashtra - 400076',
        '27AABCB1234F1Z5',
        'AABCB1234F',
        'MUMB12345E',
        'U72200MH2020PTC345678',
        '+91 22 6123 4567',
        'hr@bpftechnologies.com',
        '2026-2027',
        'MONTHLY',
        'Asia/Kolkata',
        'INR',
        'ACTIVE'
      ]
    );
    const companyId = compRes.rows[0].id;

    // 2. Units
    console.log('[Seed] Inserting Units...');
    const unitsData = [
      {
        code: 'HO-MUM',
        name: 'Head Office - Mumbai',
        location: 'Powai, Mumbai',
        address: 'Tower B, 7th Floor, Mindspace Tech Park, Powai, Mumbai, Maharashtra 400076',
        lat: 19.1176,
        lon: 72.906,
        radius: 100
      },
      {
        code: 'PLANT-PUN',
        name: 'Manufacturing Plant - Pune',
        location: 'Chakan MIDC, Pune',
        address: 'Plot 45, Phase II, Chakan Industrial Area, Pune, Maharashtra 410501',
        lat: 18.5204,
        lon: 73.8567,
        radius: 150
      },
      {
        code: 'HUB-BLR',
        name: 'Tech Innovation Hub - Bengaluru',
        location: 'Whitefield, Bengaluru',
        address: 'Sigma Soft Tech Park, Whitefield Main Road, Bengaluru, Karnataka 560066',
        lat: 12.9716,
        lon: 77.5946,
        radius: 120
      }
    ];

    const unitMap: Record<string, string> = {};
    for (const u of unitsData) {
      const uRes = await tx.query(
        `INSERT INTO units (company_id, code, name, location, address, latitude, longitude, geofence_radius_meters, geofence_enabled, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, 'ACTIVE')
         ON CONFLICT (company_id, code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id;`,
        [companyId, u.code, u.name, u.location, u.address, u.lat, u.lon, u.radius]
      );
      unitMap[u.code] = uRes.rows[0].id;
    }

    // 3. Departments
    console.log('[Seed] Inserting Departments...');
    const depts = [
      { code: 'ENG', name: 'Engineering & Technology', desc: 'Software development, architecture, QA, IT' },
      { code: 'HR', name: 'Human Resources', desc: 'Talent acquisition, employee relations, payroll support' },
      { code: 'FIN', name: 'Finance & Accounts', desc: 'Financial planning, statutory compliance, payroll approval' },
      { code: 'OPS', name: 'Operations & Manufacturing', desc: 'Plant management, logistics, supply chain' },
      { code: 'SALES', name: 'Sales & Marketing', desc: 'Enterprise business development and branding' }
    ];
    const deptMap: Record<string, string> = {};
    for (const d of depts) {
      const dRes = await tx.query(
        `INSERT INTO departments (company_id, code, name, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (company_id, code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id;`,
        [companyId, d.code, d.name, d.desc]
      );
      deptMap[d.code] = dRes.rows[0].id;
    }

    // 4. Designations
    console.log('[Seed] Inserting Designations...');
    const desigs = [
      { code: 'CTO', title: 'Chief Technology Officer', grade: 'E1' },
      { code: 'VP-ENG', title: 'VP Engineering', grade: 'E2' },
      { code: 'SR-DEV', title: 'Senior Software Engineer', grade: 'M2' },
      { code: 'DEV', title: 'Software Engineer', grade: 'M1' },
      { code: 'HR-MGR', title: 'HR Manager', grade: 'M3' },
      { code: 'HR-EXEC', title: 'HR Executive', grade: 'L2' },
      { code: 'PAY-MGR', title: 'Payroll Manager', grade: 'M3' },
      { code: 'FIN-MGR', title: 'Finance Manager', grade: 'M3' },
      { code: 'OPS-LEAD', title: 'Operations Lead', grade: 'M2' },
      { code: 'QA-LEAD', title: 'Quality Analyst', grade: 'M1' }
    ];
    const desigMap: Record<string, string> = {};
    for (const ds of desigs) {
      const dsRes = await tx.query(
        `INSERT INTO designations (company_id, code, title, grade)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (company_id, code) DO UPDATE SET title = EXCLUDED.title
         RETURNING id;`,
        [companyId, ds.code, ds.title, ds.grade]
      );
      desigMap[ds.code] = dsRes.rows[0].id;
    }

    // 5. Roles
    console.log('[Seed] Inserting Roles & Permissions...');
    const rolesList = [
      { name: 'SUPER_ADMIN', displayName: 'Super Admin', desc: 'Full unrestricted system access' },
      { name: 'ADMIN', displayName: 'Company Admin', desc: 'Administrative access for company' },
      { name: 'HR_MANAGER', displayName: 'HR Manager', desc: 'Full HR, employee, and attendance control' },
      { name: 'HR_EXECUTIVE', displayName: 'HR Executive', desc: 'Operational HR, employee onboarding' },
      { name: 'PAYROLL_MANAGER', displayName: 'Payroll Manager', desc: 'Payroll processing, salary configuration' },
      { name: 'FINANCE', displayName: 'Finance & Accounts', desc: 'Payroll approval and bank payment export' },
      { name: 'MANAGER', displayName: 'Department Manager', desc: 'Team attendance, approvals' },
      { name: 'SUPERVISOR', displayName: 'Shift Supervisor', desc: 'Shift roster, attendance verification' },
      { name: 'ATTENDANCE_OPERATOR', displayName: 'Attendance Operator', desc: 'Manual punch entry, regularization' },
      { name: 'EMPLOYEE', displayName: 'Employee', desc: 'Self-service mobile attendance, leave, payslips' },
      { name: 'MANAGEMENT', displayName: 'Management / CEO', desc: 'Executive BI dashboards, headcount analytics' }
    ];

    const roleMap: Record<string, string> = {};
    for (const r of rolesList) {
      const rRes = await tx.query(
        `INSERT INTO roles (name, display_name, description, is_system_role)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name
         RETURNING id;`,
        [r.name, r.displayName, r.desc]
      );
      roleMap[r.name] = rRes.rows[0].id;
    }

    // 6. Permissions
    const modules = [
      'company', 'unit', 'employee', 'document', 'face', 'device',
      'shift', 'attendance', 'regularization', 'leave', 'holiday',
      'overtime', 'loan', 'salary', 'payroll', 'payslip', 'reports', 'audit', 'settings'
    ];
    const actions = ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'export', 'lock', 'unlock'];

    for (const m of modules) {
      for (const a of actions) {
        const pRes = await tx.query(
          `INSERT INTO permissions (module, action, description)
           VALUES ($1, $2, $3)
           ON CONFLICT (module, action) DO UPDATE SET description = EXCLUDED.description
           RETURNING id;`,
          [m, a, `${a.toUpperCase()} permission on ${m}`]
        );
        const permId = pRes.rows[0].id;

        // Assign all permissions to SUPER_ADMIN
        await tx.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING;`,
          [roleMap['SUPER_ADMIN'], permId]
        );

        // Assign read/write to HR_MANAGER on HR modules
        if (['employee', 'document', 'face', 'shift', 'attendance', 'regularization', 'leave', 'holiday', 'reports'].includes(m)) {
          await tx.query(
            `INSERT INTO role_permissions (role_id, permission_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING;`,
            [roleMap['HR_MANAGER'], permId]
          );
        }

        // Assign to PAYROLL_MANAGER
        if (['salary', 'payroll', 'payslip', 'reports', 'loan', 'overtime'].includes(m)) {
          await tx.query(
            `INSERT INTO role_permissions (role_id, permission_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING;`,
            [roleMap['PAYROLL_MANAGER'], permId]
          );
        }
      }
    }

    // 7. Shifts
    console.log('[Seed] Inserting Shifts...');
    const shiftsData = [
      {
        name: 'General Shift',
        code: 'GEN-09-18',
        start: '09:00:00',
        end: '18:00:00',
        grace: 15,
        late: 30,
        early: 30,
        halfDay: 4.0,
        fullDay: 8.0,
        night: false,
        cross: false
      },
      {
        name: 'Morning Shift',
        code: 'MORN-07-15',
        start: '07:00:00',
        end: '15:00:00',
        grace: 10,
        late: 20,
        early: 20,
        halfDay: 4.0,
        fullDay: 8.0,
        night: false,
        cross: false
      },
      {
        name: 'Night Shift',
        code: 'NIGHT-23-07',
        start: '23:00:00',
        end: '07:00:00',
        grace: 15,
        late: 30,
        early: 30,
        halfDay: 4.0,
        fullDay: 8.0,
        night: true,
        cross: true
      }
    ];

    const shiftMap: Record<string, string> = {};
    for (const s of shiftsData) {
      const sRes = await tx.query(
        `INSERT INTO shifts (company_id, name, code, start_time, end_time, grace_period_minutes, late_threshold_minutes, early_exit_threshold_minutes, half_day_work_hours, full_day_work_hours, night_shift, cross_midnight, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ACTIVE')
         ON CONFLICT (company_id, code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id;`,
        [companyId, s.name, s.code, s.start, s.end, s.grace, s.late, s.early, s.halfDay, s.fullDay, s.night, s.cross]
      );
      shiftMap[s.code] = sRes.rows[0].id;
    }

    // 8. Leave Types
    console.log('[Seed] Inserting Leave Types...');
    const leaveTypes = [
      { name: 'Casual Leave', code: 'CL', days: 12, isPaid: true },
      { name: 'Sick Leave', code: 'SL', days: 10, isPaid: true },
      { name: 'Earned Leave', code: 'EL', days: 15, isPaid: true },
      { name: 'Maternity/Paternity Leave', code: 'ML', days: 90, isPaid: true },
      { name: 'Loss of Pay', code: 'LOP', days: 0, isPaid: false }
    ];
    for (const lt of leaveTypes) {
      await tx.query(
        `INSERT INTO leave_types (company_id, name, code, days_allowed_per_year, is_paid)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (company_id, code) DO UPDATE SET name = EXCLUDED.name;`,
        [companyId, lt.name, lt.code, lt.days, lt.isPaid]
      );
    }

    // 9. Statutory Rules
    console.log('[Seed] Inserting Statutory Rules...');
    await tx.query(
      `INSERT INTO statutory_rules (company_id, rule_name, rule_type, applicable_state, employee_rate, employer_rate, wage_ceiling, min_eligibility_wage, effective_from)
       VALUES 
       ($1, 'Provident Fund (PF) Standard', 'PF', 'ALL', 12.0, 12.0, 15000, 0, '2025-04-01'),
       ($1, 'Employee State Insurance (ESIC)', 'ESI', 'ALL', 0.75, 3.25, 21000, 0, '2025-04-01'),
       ($1, 'Maharashtra Professional Tax (PT)', 'PT', 'Maharashtra', 200.0, 0, 0, 10000, '2025-04-01')
       ON CONFLICT DO NOTHING;`,
      [companyId]
    );

    // 10. 10 Employees
    console.log('[Seed] Inserting 10 Employees...');
    const employeesData = [
      {
        code: 'BPF001',
        first: 'Rajesh',
        last: 'Sharma',
        gender: 'MALE',
        dob: '1985-06-15',
        mobile: '9820011221',
        email: 'rajesh.sharma@bpfpayroll.com',
        unit: 'HO-MUM',
        dept: 'ENG',
        desig: 'CTO',
        doj: '2020-01-10',
        ctc: 4800000,
        gross: 400000,
        basic: 200000,
        hra: 100000,
        conv: 25000,
        spl: 75000
      },
      {
        code: 'BPF002',
        first: 'Priya',
        last: 'Nair',
        gender: 'FEMALE',
        dob: '1990-03-22',
        mobile: '9820022332',
        email: 'priya.nair@bpfpayroll.com',
        unit: 'HO-MUM',
        dept: 'HR',
        desig: 'HR-MGR',
        doj: '2021-04-15',
        ctc: 1800000,
        gross: 150000,
        basic: 75000,
        hra: 37500,
        conv: 15000,
        spl: 22500
      },
      {
        code: 'BPF003',
        first: 'Amit',
        last: 'Verma',
        gender: 'MALE',
        dob: '1992-11-05',
        mobile: '9820033443',
        email: 'amit.verma@bpfpayroll.com',
        unit: 'HO-MUM',
        dept: 'FIN',
        desig: 'PAY-MGR',
        doj: '2021-08-01',
        ctc: 1500000,
        gross: 125000,
        basic: 62500,
        hra: 31250,
        conv: 10000,
        spl: 21250
      },
      {
        code: 'BPF004',
        first: 'Sneha',
        last: 'Kulkarni',
        gender: 'FEMALE',
        dob: '1994-08-19',
        mobile: '9820044554',
        email: 'sneha.k@bpfpayroll.com',
        unit: 'HUB-BLR',
        dept: 'ENG',
        desig: 'SR-DEV',
        doj: '2022-02-14',
        ctc: 2400000,
        gross: 200000,
        basic: 100000,
        hra: 50000,
        conv: 20000,
        spl: 30000
      },
      {
        code: 'BPF005',
        first: 'Vikram',
        last: 'Singh',
        gender: 'MALE',
        dob: '1988-12-30',
        mobile: '9820055665',
        email: 'vikram.singh@bpfpayroll.com',
        unit: 'PLANT-PUN',
        dept: 'OPS',
        desig: 'OPS-LEAD',
        doj: '2019-11-01',
        ctc: 1600000,
        gross: 133333,
        basic: 66667,
        hra: 33333,
        conv: 15000,
        spl: 18333
      },
      {
        code: 'BPF006',
        first: 'Ananya',
        last: 'Iyer',
        gender: 'FEMALE',
        dob: '1997-04-12',
        mobile: '9820066776',
        email: 'ananya.iyer@bpfpayroll.com',
        unit: 'HUB-BLR',
        dept: 'ENG',
        desig: 'DEV',
        doj: '2023-06-01',
        ctc: 1200000,
        gross: 100000,
        basic: 50000,
        hra: 25000,
        conv: 10000,
        spl: 15000
      },
      {
        code: 'BPF007',
        first: 'Rohan',
        last: 'Mehta',
        gender: 'MALE',
        dob: '1989-09-08',
        mobile: '9820077887',
        email: 'rohan.mehta@bpfpayroll.com',
        unit: 'HO-MUM',
        dept: 'FIN',
        desig: 'FIN-MGR',
        doj: '2020-09-15',
        ctc: 2100000,
        gross: 175000,
        basic: 87500,
        hra: 43750,
        conv: 15000,
        spl: 28750
      },
      {
        code: 'BPF008',
        first: 'Neha',
        last: 'Gupta',
        gender: 'FEMALE',
        dob: '1996-01-25',
        mobile: '9820088998',
        email: 'neha.gupta@bpfpayroll.com',
        unit: 'HO-MUM',
        dept: 'HR',
        desig: 'HR-EXEC',
        doj: '2023-01-09',
        ctc: 720000,
        gross: 60000,
        basic: 30000,
        hra: 15000,
        conv: 5000,
        spl: 10000
      },
      {
        code: 'BPF009',
        first: 'Manoj',
        last: 'Patil',
        gender: 'MALE',
        dob: '1991-07-14',
        mobile: '9820099009',
        email: 'manoj.patil@bpfpayroll.com',
        unit: 'PLANT-PUN',
        dept: 'OPS',
        desig: 'OPS-LEAD',
        doj: '2021-03-01',
        ctc: 840000,
        gross: 70000,
        basic: 35000,
        hra: 17500,
        conv: 7500,
        spl: 10000
      },
      {
        code: 'BPF010',
        first: 'Pooja',
        last: 'Reddy',
        gender: 'FEMALE',
        dob: '1995-10-18',
        mobile: '9820100110',
        email: 'pooja.reddy@bpfpayroll.com',
        unit: 'HUB-BLR',
        dept: 'ENG',
        desig: 'QA-LEAD',
        doj: '2022-08-22',
        ctc: 1080000,
        gross: 90000,
        basic: 45000,
        hra: 22500,
        conv: 10000,
        spl: 12500
      }
    ];

    const empIdMap: Record<string, string> = {};
    for (const emp of employeesData) {
      const eRes = await tx.query(
        `INSERT INTO employees (
          company_id, unit_id, department_id, designation_id, employee_code,
          first_name, last_name, full_name, date_of_birth, gender, marital_status,
          mobile, email, address, city, state, pincode, date_of_joining,
          employment_type, work_status, bank_name, account_number, ifsc_code,
          pan_number, aadhaar_ref, uan_number, esic_number, pf_applicable,
          esic_applicable, pt_applicable, tds_applicable, status
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, 'SINGLE',
          $11, $12, 'Sample Address Road', 'Mumbai', 'Maharashtra', '400076', $13,
          'FULL_TIME', 'OFFICE', 'HDFC Bank', '50100234567890', 'HDFC0001234',
          'ABCDE1234F', '987654321012', '100123456789', '20123456789012345', true,
          true, true, true, 'ACTIVE'
        )
        ON CONFLICT (employee_code) DO UPDATE SET full_name = EXCLUDED.full_name
        RETURNING id;`,
        [
          companyId,
          unitMap[emp.unit],
          deptMap[emp.dept],
          desigMap[emp.desig],
          emp.code,
          emp.first,
          emp.last,
          `${emp.first} ${emp.last}`,
          emp.dob,
          emp.gender,
          emp.mobile,
          emp.email,
          emp.doj
        ]
      );
      const employeeId = eRes.rows[0].id;
      empIdMap[emp.code] = employeeId;

      // Insert active salary structure
      await tx.query(
        `INSERT INTO employee_salary_structures (
          employee_id, effective_from, ctc_annual, gross_monthly, basic, hra,
          conveyance, special_allowance, medical_allowance, other_allowances, is_active
        ) VALUES ($1, '2026-04-01', $2, $3, $4, $5, $6, $7, 0, 0, true)
        ON CONFLICT DO NOTHING;`,
        [employeeId, emp.ctc, emp.gross, emp.basic, emp.hra, emp.conv, emp.spl]
      );

      // Assign Shift (General Shift)
      await tx.query(
        `INSERT INTO shift_assignments (employee_id, shift_id, start_date)
         VALUES ($1, $2, '2026-01-01')
         ON CONFLICT DO NOTHING;`,
        [employeeId, shiftMap['GEN-09-18']]
      );
    }

    // 11. Users & Logins
    console.log('[Seed] Generating User Credentials & Hashes...');
    const adminPassHash = await bcrypt.hash('admin123', 10);
    const hrPassHash = await bcrypt.hash('hr123', 10);
    const payrollPassHash = await bcrypt.hash('payroll123', 10);
    const supPassHash = await bcrypt.hash('sup123', 10);
    const empPassHash = await bcrypt.hash('emp123', 10);

    const usersToCreate = [
      {
        username: 'superadmin',
        email: 'admin@bpfpayroll.com',
        pass: adminPassHash,
        fullName: 'Super Administrator',
        role: 'SUPER_ADMIN',
        empId: null
      },
      {
        username: 'hr_manager',
        email: 'hr@bpfpayroll.com',
        pass: hrPassHash,
        fullName: 'Priya Nair (HR Manager)',
        role: 'HR_MANAGER',
        empId: empIdMap['BPF002']
      },
      {
        username: 'payroll_admin',
        email: 'payroll@bpfpayroll.com',
        pass: payrollPassHash,
        fullName: 'Amit Verma (Payroll Specialist)',
        role: 'PAYROLL_MANAGER',
        empId: empIdMap['BPF003']
      },
      {
        username: 'supervisor',
        email: 'supervisor@bpfpayroll.com',
        pass: supPassHash,
        fullName: 'Manoj Patil (Supervisor)',
        role: 'SUPERVISOR',
        empId: empIdMap['BPF009']
      },
      {
        username: 'emp_rajesh',
        email: 'emp001@bpfpayroll.com',
        pass: empPassHash,
        fullName: 'Rajesh Sharma',
        role: 'EMPLOYEE',
        empId: empIdMap['BPF001']
      },
      {
        username: 'emp_ananya',
        email: 'emp006@bpfpayroll.com',
        pass: empPassHash,
        fullName: 'Ananya Iyer',
        role: 'EMPLOYEE',
        empId: empIdMap['BPF006']
      }
    ];

    for (const u of usersToCreate) {
      const uRes = await tx.query(
        `INSERT INTO users (company_id, unit_id, username, email, password_hash, full_name, status, employee_id)
         VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
         RETURNING id;`,
        [companyId, unitMap['HO-MUM'], u.username, u.email, u.pass, u.fullName, u.empId]
      );
      const userId = uRes.rows[0].id;

      // Assign user role
      await tx.query(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING;`,
        [userId, roleMap[u.role]]
      );
    }
  });

  console.log('====================================================');
  console.log('  SEED COMPLETED SUCCESSFULLY!');
  console.log('  Credentials:');
  console.log('  - Super Admin: admin@bpfpayroll.com / admin123');
  console.log('  - HR Manager:  hr@bpfpayroll.com / hr123');
  console.log('  - Payroll:     payroll@bpfpayroll.com / payroll123');
  console.log('  - Supervisor:  supervisor@bpfpayroll.com / sup123');
  console.log('  - Employee:    emp001@bpfpayroll.com / emp123');
  console.log('  Company Code:  BPF-TECH');
  console.log('====================================================');
}

if (process.argv[1] && (process.argv[1].includes('seed.ts') || process.argv[1].includes('seed.js'))) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]', err);
      process.exit(1);
    });
}
