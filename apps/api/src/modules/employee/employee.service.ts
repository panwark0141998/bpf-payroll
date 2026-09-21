import { db } from '../../database/db.js';
import { AuditService } from '../audit/audit.service.js';

export interface EmployeeFilterParams {
  companyId: string;
  unitId?: string;
  departmentId?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export class EmployeeService {
  static async getEmployees(filters: EmployeeFilterParams, hasSensitiveAccess = true) {
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize || 20));
    const offset = (page - 1) * pageSize;

    const params: any[] = [filters.companyId];
    const conditions: string[] = [`e.company_id = $1`];

    if (filters.unitId) {
      params.push(filters.unitId);
      conditions.push(`e.unit_id = $${params.length}`);
    }

    if (filters.departmentId) {
      params.push(filters.departmentId);
      conditions.push(`e.department_id = $${params.length}`);
    }

    if (filters.status) {
      params.push(filters.status);
      conditions.push(`e.status = $${params.length}`);
    }

    if (filters.search) {
      params.push(`%${filters.search.trim()}%`);
      const pIdx = params.length;
      conditions.push(
        `(e.employee_code ILIKE $${pIdx} OR e.full_name ILIKE $${pIdx} OR e.email ILIKE $${pIdx} OR e.mobile ILIKE $${pIdx})`
      );
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await db.query(
      `SELECT COUNT(*) as total FROM employees e ${whereClause};`,
      params
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    params.push(pageSize);
    params.push(offset);

    const query = `
      SELECT 
        e.id, e.company_id, e.unit_id, e.department_id, e.designation_id,
        e.employee_code, e.first_name, e.middle_name, e.last_name, e.full_name,
        e.date_of_birth, e.gender, e.marital_status, e.mobile, e.email,
        e.address, e.city, e.state, e.pincode, e.date_of_joining, e.grade,
        e.employment_type, e.work_status, e.status, e.face_enrolled,
        e.bank_name, e.account_number, e.ifsc_code, e.pan_number, e.aadhaar_ref,
        e.uan_number, e.esic_number, e.pf_applicable, e.esic_applicable, e.pt_applicable, e.tds_applicable,
        u.name as unit_name,
        d.name as department_name,
        ds.title as designation_title,
        m.full_name as manager_name,
        ess.ctc_annual, ess.gross_monthly, ess.basic, ess.hra
      FROM employees e
      LEFT JOIN units u ON e.unit_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations ds ON e.designation_id = ds.id
      LEFT JOIN employees m ON e.reporting_manager_id = m.id
      LEFT JOIN employee_salary_structures ess ON ess.employee_id = e.id AND ess.is_active = true
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `;

    const rowsRes = await db.query(query, params);

    const items = rowsRes.rows.map((emp: any) => {
      if (!hasSensitiveAccess) {
        emp.account_number = emp.account_number ? `XXXX${emp.account_number.slice(-4)}` : null;
        emp.aadhaar_ref = emp.aadhaar_ref ? `XXXXXXXX${emp.aadhaar_ref.slice(-4)}` : null;
        emp.pan_number = emp.pan_number ? `${emp.pan_number.slice(0, 2)}XXXXX${emp.pan_number.slice(-2)}` : null;
        emp.ctc_annual = null;
        emp.gross_monthly = null;
        emp.basic = null;
        emp.hra = null;
      }
      return emp;
    });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  static async getEmployeeById(id: string, hasSensitiveAccess = true) {
    const query = `
      SELECT 
        e.*,
        u.name as unit_name,
        d.name as department_name,
        ds.title as designation_title,
        m.full_name as manager_name,
        ess.id as salary_structure_id,
        ess.ctc_annual, ess.gross_monthly, ess.basic, ess.hra,
        ess.conveyance, ess.special_allowance, ess.medical_allowance, ess.other_allowances,
        sh.id as shift_id, sh.name as shift_name, sh.start_time, sh.end_time
      FROM employees e
      LEFT JOIN units u ON e.unit_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations ds ON e.designation_id = ds.id
      LEFT JOIN employees m ON e.reporting_manager_id = m.id
      LEFT JOIN employee_salary_structures ess ON ess.employee_id = e.id AND ess.is_active = true
      LEFT JOIN shift_assignments sa ON sa.employee_id = e.id AND (sa.end_date IS NULL OR sa.end_date >= CURRENT_DATE)
      LEFT JOIN shifts sh ON sa.shift_id = sh.id
      WHERE e.id = $1;
    `;

    const res = await db.query(query, [id]);
    if (res.rows.length === 0) {
      throw { statusCode: 404, message: 'Employee not found', code: 'EMPLOYEE_NOT_FOUND' };
    }

    const emp = res.rows[0];
    if (!hasSensitiveAccess) {
      emp.account_number = emp.account_number ? `XXXX${emp.account_number.slice(-4)}` : null;
      emp.aadhaar_ref = emp.aadhaar_ref ? `XXXXXXXX${emp.aadhaar_ref.slice(-4)}` : null;
      emp.pan_number = emp.pan_number ? `${emp.pan_number.slice(0, 2)}XXXXX${emp.pan_number.slice(-2)}` : null;
      emp.ctc_annual = null;
      emp.gross_monthly = null;
      emp.basic = null;
      emp.hra = null;
    }

    return emp;
  }

  static async createEmployee(data: any, userId?: string) {
    return await db.transaction(async (tx) => {
      // Check duplicate employee code
      const dupRes = await tx.query(
        `SELECT id FROM employees WHERE UPPER(employee_code) = UPPER($1);`,
        [data.employeeCode.trim()]
      );
      if (dupRes.rows.length > 0) {
        throw { statusCode: 400, message: 'Employee code already exists', code: 'DUPLICATE_CODE' };
      }

      const fullName = `${data.firstName.trim()}${data.middleName ? ' ' + data.middleName.trim() : ''} ${data.lastName.trim()}`;

      // Insert Employee Master
      const empRes = await tx.query(
        `INSERT INTO employees (
          company_id, unit_id, department_id, designation_id, employee_code,
          first_name, middle_name, last_name, full_name, father_husband_name,
          date_of_birth, gender, marital_status, mobile, email, address,
          city, state, pincode, emergency_contact, date_of_joining, grade,
          employment_type, reporting_manager_id, work_status, bank_name,
          account_number, ifsc_code, pan_number, aadhaar_ref, uan_number,
          esic_number, pf_applicable, esic_applicable, pt_applicable,
          tds_applicable, salary_structure_type, status
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22,
          $23, $24, $25, $26,
          $27, $28, $29, $30, $31,
          $32, $33, $34, $35,
          $36, $37, 'ACTIVE'
        ) RETURNING *;`,
        [
          data.companyId,
          data.unitId,
          data.departmentId,
          data.designationId,
          data.employeeCode.trim().toUpperCase(),
          data.firstName.trim(),
          data.middleName ? data.middleName.trim() : null,
          data.lastName.trim(),
          fullName,
          data.fatherHusbandName || null,
          data.dateOfBirth,
          data.gender,
          data.maritalStatus || 'SINGLE',
          data.mobile.trim(),
          data.email.trim().toLowerCase(),
          data.address,
          data.city,
          data.state,
          data.pincode,
          data.emergencyContact || null,
          data.dateOfJoining,
          data.grade || null,
          data.employmentType || 'FULL_TIME',
          data.reportingManagerId || null,
          data.workStatus || 'OFFICE',
          data.bankName || null,
          data.accountNumber || null,
          data.ifscCode ? data.ifscCode.toUpperCase() : null,
          data.panNumber ? data.panNumber.toUpperCase() : null,
          data.aadhaarRef || null,
          data.uanNumber || null,
          data.esicNumber || null,
          data.pfApplicable !== false,
          data.esicApplicable !== false,
          data.ptApplicable !== false,
          data.tdsApplicable === true,
          data.salaryStructureType || 'STANDARD'
        ]
      );

      const createdEmp = empRes.rows[0];

      // Create Initial Salary Structure if provided
      if (data.grossMonthly > 0 || data.basic > 0) {
        await tx.query(
          `INSERT INTO employee_salary_structures (
            employee_id, effective_from, ctc_annual, gross_monthly, basic, hra,
            conveyance, special_allowance, medical_allowance, other_allowances, is_active, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, true, $10);`,
          [
            createdEmp.id,
            data.dateOfJoining,
            data.ctcAnnual || data.grossMonthly * 12,
            data.grossMonthly,
            data.basic,
            data.hra || 0,
            data.conveyance || 0,
            data.specialAllowance || 0,
            data.medicalAllowance || 0,
            userId || null
          ]
        );
      }

      // Assign Default General Shift
      const defaultShiftRes = await tx.query(
        `SELECT id FROM shifts WHERE company_id = $1 AND status = 'ACTIVE' ORDER BY created_at ASC LIMIT 1;`,
        [data.companyId]
      );
      if (defaultShiftRes.rows.length > 0) {
        await tx.query(
          `INSERT INTO shift_assignments (employee_id, shift_id, start_date, assigned_by)
           VALUES ($1, $2, $3, $4);`,
          [createdEmp.id, defaultShiftRes.rows[0].id, data.dateOfJoining, userId || null]
        );
      }

      // Initialize Leave Balances for current year
      const currentYear = new Date().getFullYear();
      const leaveTypesRes = await tx.query(
        `SELECT id, days_allowed_per_year FROM leave_types WHERE company_id = $1;`,
        [data.companyId]
      );
      for (const lt of leaveTypesRes.rows) {
        await tx.query(
          `INSERT INTO leave_balances (employee_id, leave_type_id, year, total_credited, used, pending, balance)
           VALUES ($1, $2, $3, $4, 0, 0, $4)
           ON CONFLICT DO NOTHING;`,
          [createdEmp.id, lt.id, currentYear, lt.days_allowed_per_year]
        );
      }

      await AuditService.log({
        userId,
        action: 'CREATE',
        module: 'employee',
        recordId: createdEmp.id,
        newValue: createdEmp
      });

      return createdEmp;
    });
  }

  static async updateEmployee(id: string, data: any, userId?: string) {
    const oldEmp = await this.getEmployeeById(id);

    const fullName =
      data.firstName || data.lastName
        ? `${(data.firstName || oldEmp.first_name).trim()} ${(data.lastName || oldEmp.last_name).trim()}`
        : oldEmp.full_name;

    const res = await db.query(
      `UPDATE employees SET
        unit_id = COALESCE($1, unit_id),
        department_id = COALESCE($2, department_id),
        designation_id = COALESCE($3, designation_id),
        first_name = COALESCE($4, first_name),
        middle_name = COALESCE($5, middle_name),
        last_name = COALESCE($6, last_name),
        full_name = $7,
        father_husband_name = COALESCE($8, father_husband_name),
        date_of_birth = COALESCE($9, date_of_birth),
        gender = COALESCE($10, gender),
        marital_status = COALESCE($11, marital_status),
        mobile = COALESCE($12, mobile),
        email = COALESCE($13, email),
        address = COALESCE($14, address),
        city = COALESCE($15, city),
        state = COALESCE($16, state),
        pincode = COALESCE($17, pincode),
        emergency_contact = COALESCE($18, emergency_contact),
        grade = COALESCE($19, grade),
        employment_type = COALESCE($20, employment_type),
        reporting_manager_id = COALESCE($21, reporting_manager_id),
        work_status = COALESCE($22, work_status),
        bank_name = COALESCE($23, bank_name),
        account_number = COALESCE($24, account_number),
        ifsc_code = COALESCE($25, ifsc_code),
        pan_number = COALESCE($26, pan_number),
        aadhaar_ref = COALESCE($27, aadhaar_ref),
        uan_number = COALESCE($28, uan_number),
        esic_number = COALESCE($29, esic_number),
        pf_applicable = COALESCE($30, pf_applicable),
        esic_applicable = COALESCE($31, esic_applicable),
        pt_applicable = COALESCE($32, pt_applicable),
        tds_applicable = COALESCE($33, tds_applicable),
        status = COALESCE($34, status),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $35
       RETURNING *;`,
      [
        data.unitId,
        data.departmentId,
        data.designationId,
        data.firstName,
        data.middleName,
        data.lastName,
        fullName,
        data.fatherHusbandName,
        data.dateOfBirth,
        data.gender,
        data.maritalStatus,
        data.mobile,
        data.email,
        data.address,
        data.city,
        data.state,
        data.pincode,
        data.emergencyContact,
        data.grade,
        data.employmentType,
        data.reportingManagerId,
        data.workStatus,
        data.bankName,
        data.accountNumber,
        data.ifscCode ? data.ifscCode.toUpperCase() : null,
        data.panNumber ? data.panNumber.toUpperCase() : null,
        data.aadhaarRef,
        data.uanNumber,
        data.esicNumber,
        data.pfApplicable,
        data.esicApplicable,
        data.ptApplicable,
        data.tdsApplicable,
        data.status,
        id
      ]
    );

    await AuditService.log({
      userId,
      action: 'UPDATE',
      module: 'employee',
      recordId: id,
      oldValue: oldEmp,
      newValue: res.rows[0]
    });

    return res.rows[0];
  }

  static async deactivateEmployee(id: string, exitDate: string, exitReason: string, userId?: string) {
    const oldEmp = await this.getEmployeeById(id);

    const res = await db.query(
      `UPDATE employees SET
         status = 'EXITED',
         exit_date = $1,
         exit_reason = $2,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *;`,
      [exitDate, exitReason, id]
    );

    await AuditService.log({
      userId,
      action: 'DEACTIVATE',
      module: 'employee',
      recordId: id,
      oldValue: oldEmp,
      newValue: res.rows[0]
    });

    return res.rows[0];
  }
}
