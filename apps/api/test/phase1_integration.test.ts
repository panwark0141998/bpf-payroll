import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { CompanyService } from '../src/modules/company/company.service.js';
import { EmployeeService } from '../src/modules/employee/employee.service.js';
import { DashboardService } from '../src/modules/reports/dashboard.service.js';
import { db } from '../src/database/db.js';

test('BPF Payroll Phase 1: Authentication & RBAC', async (t) => {
  await t.test('Desktop Login: Super Admin valid credentials', async () => {
    const result = await AuthService.desktopLogin({
      companyCode: 'BPF-TECH',
      usernameOrEmail: 'admin@bpfpayroll.com',
      password: 'admin123'
    });

    assert.equal(result.user.companyCode, 'BPF-TECH');
    assert.equal(result.user.email, 'admin@bpfpayroll.com');
    assert.ok(result.user.roles.includes('SUPER_ADMIN'));
    assert.ok(result.tokens.accessToken.length > 20);
    assert.ok(result.tokens.refreshToken.length > 20);
  });

  await t.test('Desktop Login: Reject invalid password', async () => {
    await assert.rejects(
      async () => {
        await AuthService.desktopLogin({
          companyCode: 'BPF-TECH',
          usernameOrEmail: 'admin@bpfpayroll.com',
          password: 'wrong_password'
        });
      },
      (err: any) => {
        assert.equal(err.code, 'INVALID_CREDENTIALS');
        return true;
      }
    );
  });

  await t.test('Desktop Login: Reject invalid company code', async () => {
    await assert.rejects(
      async () => {
        await AuthService.desktopLogin({
          companyCode: 'NON_EXISTENT',
          usernameOrEmail: 'admin@bpfpayroll.com',
          password: 'admin123'
        });
      },
      (err: any) => {
        assert.equal(err.code, 'INVALID_COMPANY');
        return true;
      }
    );
  });

  await t.test('Mobile Login: Employee authentication & device registration', async () => {
    const result = await AuthService.mobileLogin({
      companyCode: 'BPF-TECH',
      employeeCodeOrMobile: 'BPF001',
      pinOrPassword: '1234',
      deviceId: 'TEST-DEVICE-001',
      deviceModel: 'Pixel 8',
      osVersion: 'Android 14'
    });

    assert.equal(result.employee.employeeCode, 'BPF001');
    assert.ok(result.tokens.accessToken.length > 20);

    // Verify device is recorded in database
    const devRes = await db.query(
      `SELECT * FROM devices WHERE employee_id = $1 AND device_id = $2;`,
      [result.employee.id, 'TEST-DEVICE-001']
    );
    assert.equal(devRes.rows.length, 1);
    assert.equal(devRes.rows[0].status, 'APPROVED');
  });
});

test('BPF Payroll Phase 1: Company & Unit Management', async (t) => {
  const companies = await CompanyService.getCompanies();
  assert.ok(companies.length >= 1);
  const company = companies[0];

  await t.test('Get Operating Units for Company', async () => {
    const units = await CompanyService.getUnits(company.id);
    assert.equal(units.length, 3);
    const names = units.map((u) => u.name);
    assert.ok(names.some((n) => n.includes('Mumbai')));
    assert.ok(names.some((n) => n.includes('Pune')));
    assert.ok(names.some((n) => n.includes('Bengaluru')));
  });

  await t.test('Get Departments and Designations', async () => {
    const depts = await CompanyService.getDepartments(company.id);
    assert.equal(depts.length, 5);

    const desigs = await CompanyService.getDesignations(company.id);
    assert.ok(desigs.length >= 10);
  });
});

test('BPF Payroll Phase 1: Employee Master & Sensitive Masking', async (t) => {
  const companies = await CompanyService.getCompanies();
  const companyId = companies[0].id;

  await t.test('List employees with sensitive access (HR/Admin)', async () => {
    const result = await EmployeeService.getEmployees({ companyId }, true);
    assert.equal(result.total, 10);
    assert.equal(result.items.length, 10);

    // Should have full bank account
    const bpf001 = result.items.find((e) => e.employee_code === 'BPF001');
    assert.ok(bpf001);
    assert.equal(bpf001.account_number, '50100234567890');
    assert.equal(bpf001.pan_number, 'ABCDE1234F');
  });

  await t.test('List employees without sensitive access (Masked PII)', async () => {
    const result = await EmployeeService.getEmployees({ companyId }, false);
    const bpf001 = result.items.find((e) => e.employee_code === 'BPF001');
    assert.ok(bpf001);
    assert.equal(bpf001.account_number, 'XXXX7890');
    assert.equal(bpf001.pan_number, 'ABXXXXX4F');
    assert.equal(bpf001.basic, null);
  });

  await t.test('Search employee by code, email or name', async () => {
    const byCode = await EmployeeService.getEmployees({ companyId, search: 'BPF004' });
    assert.equal(byCode.items.length, 1);
    assert.equal(byCode.items[0].full_name, 'Sneha Kulkarni');

    const byName = await EmployeeService.getEmployees({ companyId, search: 'Priya' });
    assert.equal(byName.items.length, 1);
    assert.equal(byName.items[0].employee_code, 'BPF002');
  });

  await t.test('Live Dashboard Metrics calculation', async () => {
    const metrics = await DashboardService.getMetrics(companyId);
    assert.equal(metrics.totalEmployees, 10);
    assert.equal(metrics.activeEmployees, 10);
    assert.ok(metrics.departmentAttendanceBreakdown.length > 0);
  });
});
