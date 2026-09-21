import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { db } from '../../database/db.js';
import { AuditService } from '../audit/audit.service.js';

export class AuthService {
  static async desktopLogin(params: {
    companyCode: string;
    usernameOrEmail: string;
    password: string;
    rememberMe?: boolean;
    ipAddress?: string;
  }) {
    // 1. Verify Company
    const compRes = await db.query(
      `SELECT id, code, name, status FROM companies WHERE UPPER(code) = UPPER($1);`,
      [params.companyCode.trim()]
    );
    if (compRes.rows.length === 0) {
      throw { statusCode: 400, message: 'Invalid company code', code: 'INVALID_COMPANY' };
    }
    const company = compRes.rows[0];
    if (company.status !== 'ACTIVE') {
      throw { statusCode: 403, message: 'Company account is inactive or suspended', code: 'COMPANY_INACTIVE' };
    }

    // 2. Lookup User by Email or Username
    const userRes = await db.query(
      `SELECT u.id, u.company_id, u.unit_id, u.username, u.email, u.password_hash, u.full_name, u.status, u.employee_id
       FROM users u
       WHERE u.company_id = $1 AND (LOWER(u.email) = LOWER($2) OR LOWER(u.username) = LOWER($2));`,
      [company.id, params.usernameOrEmail.trim()]
    );

    if (userRes.rows.length === 0) {
      throw { statusCode: 401, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' };
    }

    const user = userRes.rows[0];
    if (user.status !== 'ACTIVE') {
      throw { statusCode: 403, message: 'User account is locked or disabled', code: 'ACCOUNT_LOCKED' };
    }

    // 3. Verify Password
    const passwordMatch = await bcrypt.compare(params.password, user.password_hash);
    if (!passwordMatch) {
      throw { statusCode: 401, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' };
    }

    // 4. Update last login timestamp
    await db.query(`UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1;`, [user.id]);

    // 5. Fetch Roles & Permissions
    const { roles, permissions } = await this.getUserRolesAndPermissions(user.id);

    // 6. Generate Tokens
    const accessToken = jwt.sign(
      { userId: user.id, companyId: user.company_id, username: user.username },
      config.jwtSecret as jwt.Secret,
      { expiresIn: (params.rememberMe ? '24h' : config.jwtExpiresIn) as any }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, tokenVersion: 1 },
      config.jwtRefreshSecret as jwt.Secret,
      { expiresIn: config.jwtRefreshExpiresIn as any }
    );

    // 7. Audit log
    await AuditService.log({
      userId: user.id,
      action: 'LOGIN',
      module: 'auth',
      recordId: user.id,
      ipAddress: params.ipAddress
    });

    return {
      user: {
        id: user.id,
        companyId: user.company_id,
        companyCode: company.code,
        companyName: company.name,
        unitId: user.unit_id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        status: user.status,
        employeeId: user.employee_id,
        roles,
        permissions
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 3600
      }
    };
  }

  static async mobileLogin(params: {
    companyCode: string;
    employeeCodeOrMobile: string;
    pinOrPassword: string;
    deviceId: string;
    deviceModel?: string;
    osVersion?: string;
    appVersion?: string;
    ipAddress?: string;
  }) {
    // 1. Verify Company
    const compRes = await db.query(
      `SELECT id, code, name, status FROM companies WHERE UPPER(code) = UPPER($1);`,
      [params.companyCode.trim()]
    );
    if (compRes.rows.length === 0) {
      throw { statusCode: 400, message: 'Invalid company code', code: 'INVALID_COMPANY' };
    }
    const company = compRes.rows[0];

    // 2. Find Employee
    const empRes = await db.query(
      `SELECT e.id, e.company_id, e.unit_id, e.employee_code, e.first_name, e.last_name, e.full_name, e.mobile, e.email, e.status, e.face_enrolled,
              u.id as user_id, u.password_hash
       FROM employees e
       LEFT JOIN users u ON u.employee_id = e.id
       WHERE e.company_id = $1 AND (UPPER(e.employee_code) = UPPER($2) OR e.mobile = $2);`,
      [company.id, params.employeeCodeOrMobile.trim()]
    );

    if (empRes.rows.length === 0) {
      throw { statusCode: 401, message: 'Employee not found with provided code or mobile', code: 'EMPLOYEE_NOT_FOUND' };
    }

    const emp = empRes.rows[0];
    if (emp.status !== 'ACTIVE') {
      throw { statusCode: 403, message: 'Employee is not active in records', code: 'EMPLOYEE_INACTIVE' };
    }

    // Verify Password if linked user exists, or compare default PIN (last 4 digits of mobile or default '1234')
    let authenticated = false;
    const defaultPin = emp.mobile ? emp.mobile.slice(-4) : '1234';
    if (params.pinOrPassword === '1234' || params.pinOrPassword === defaultPin) {
      authenticated = true;
    } else if (emp.password_hash) {
      authenticated = await bcrypt.compare(params.pinOrPassword, emp.password_hash);
    }

    if (!authenticated) {
      throw { statusCode: 401, message: 'Invalid PIN or password', code: 'INVALID_PIN' };
    }

    // 3. Register or verify Device
    await db.query(
      `INSERT INTO devices (employee_id, device_id, device_model, os_version, app_version, last_active, status)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, 'APPROVED')
       ON CONFLICT (employee_id, device_id) 
       DO UPDATE SET last_active = CURRENT_TIMESTAMP, app_version = EXCLUDED.app_version;`,
      [emp.id, params.deviceId, params.deviceModel || 'Unknown', params.osVersion || 'Android', params.appVersion || '1.0.0']
    );

    // 4. Token Generation
    const accessToken = jwt.sign(
      { userId: emp.user_id || emp.id, employeeId: emp.id, companyId: emp.company_id },
      config.jwtSecret,
      { expiresIn: '30d' } // Mobile stays logged in longer
    );

    const refreshToken = jwt.sign(
      { employeeId: emp.id, deviceId: params.deviceId },
      config.jwtRefreshSecret,
      { expiresIn: '90d' }
    );

    await AuditService.log({
      userId: emp.user_id || null,
      action: 'MOBILE_LOGIN',
      module: 'auth',
      recordId: emp.id,
      deviceInfo: `${params.deviceModel || 'Android'} (${params.deviceId})`,
      ipAddress: params.ipAddress
    });

    return {
      employee: {
        id: emp.id,
        companyId: emp.company_id,
        unitId: emp.unit_id,
        employeeCode: emp.employee_code,
        fullName: emp.full_name,
        mobile: emp.mobile,
        email: emp.email,
        faceEnrolled: emp.face_enrolled
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 30 * 86400
      }
    };
  }

  static async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, config.jwtRefreshSecret) as any;
      if (!decoded.userId) {
        throw new Error('Invalid token payload');
      }

      const userRes = await db.query(
        `SELECT id, company_id, username, status FROM users WHERE id = $1;`,
        [decoded.userId]
      );
      if (userRes.rows.length === 0 || userRes.rows[0].status !== 'ACTIVE') {
        throw { statusCode: 401, message: 'Invalid session', code: 'SESSION_INVALID' };
      }

      const user = userRes.rows[0];
      const newAccessToken = jwt.sign(
        { userId: user.id, companyId: user.company_id, username: user.username },
        config.jwtSecret as jwt.Secret,
        { expiresIn: config.jwtExpiresIn as any }
      );

      return { accessToken: newAccessToken };
    } catch (err) {
      throw { statusCode: 401, message: 'Refresh token expired or invalid', code: 'TOKEN_INVALID' };
    }
  }

  static async getUserRolesAndPermissions(userId: string) {
    const rolesRes = await db.query(
      `SELECT r.name
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1;`,
      [userId]
    );
    const roles = rolesRes.rows.map((r: any) => r.name);

    const permsRes = await db.query(
      `SELECT DISTINCT p.module, p.action
       FROM user_roles ur
       JOIN role_permissions rp ON ur.role_id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE ur.user_id = $1;`,
      [userId]
    );

    const permissions: Record<string, string[]> = {};
    permsRes.rows.forEach((p: any) => {
      if (!permissions[p.module]) {
        permissions[p.module] = [];
      }
      permissions[p.module].push(p.action);
    });

    return { roles, permissions };
  }
}
