import { db } from '../../database/db.js';
import { AuditService } from '../audit/audit.service.js';

export class CompanyService {
  static async getCompanies() {
    const res = await db.query(
      `SELECT id, code, name, legal_name, address, gstin, pan, tan, cin, phone, email, logo_url,
              financial_year, payroll_cycle, timezone, currency, status, created_at
       FROM companies
       ORDER BY name ASC;`
    );
    return res.rows;
  }

  static async getCompanyById(id: string) {
    const res = await db.query(
      `SELECT * FROM companies WHERE id = $1;`,
      [id]
    );
    if (res.rows.length === 0) {
      throw { statusCode: 404, message: 'Company not found', code: 'NOT_FOUND' };
    }
    return res.rows[0];
  }

  static async updateCompany(id: string, data: any, userId?: string) {
    const old = await this.getCompanyById(id);
    const res = await db.query(
      `UPDATE companies SET
         name = COALESCE($1, name),
         legal_name = COALESCE($2, legal_name),
         address = COALESCE($3, address),
         gstin = COALESCE($4, gstin),
         pan = COALESCE($5, pan),
         phone = COALESCE($6, phone),
         email = COALESCE($7, email),
         timezone = COALESCE($8, timezone),
         currency = COALESCE($9, currency),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *;`,
      [data.name, data.legalName, data.address, data.gstin, data.pan, data.phone, data.email, data.timezone, data.currency, id]
    );

    await AuditService.log({
      userId,
      action: 'UPDATE',
      module: 'company',
      recordId: id,
      oldValue: old,
      newValue: res.rows[0]
    });

    return res.rows[0];
  }

  static async getUnits(companyId: string) {
    const res = await db.query(
      `SELECT u.*, COUNT(e.id) as employee_count
       FROM units u
       LEFT JOIN employees e ON e.unit_id = u.id AND e.status = 'ACTIVE'
       WHERE u.company_id = $1
       GROUP BY u.id
       ORDER BY u.name ASC;`,
      [companyId]
    );
    return res.rows;
  }

  static async createUnit(companyId: string, data: any, userId?: string) {
    const res = await db.query(
      `INSERT INTO units (
        company_id, code, name, location, address, latitude, longitude, geofence_radius_meters, geofence_enabled, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVE')
       RETURNING *;`,
      [
        companyId,
        data.code.toUpperCase(),
        data.name,
        data.location,
        data.address,
        data.latitude,
        data.longitude,
        data.geofenceRadiusMeters || 100,
        data.geofenceEnabled !== false
      ]
    );

    await AuditService.log({
      userId,
      action: 'CREATE',
      module: 'unit',
      recordId: res.rows[0].id,
      newValue: res.rows[0]
    });

    return res.rows[0];
  }

  static async updateUnit(id: string, data: any, userId?: string) {
    const oldRes = await db.query(`SELECT * FROM units WHERE id = $1;`, [id]);
    if (oldRes.rows.length === 0) {
      throw { statusCode: 404, message: 'Unit not found', code: 'NOT_FOUND' };
    }
    const old = oldRes.rows[0];

    const res = await db.query(
      `UPDATE units SET
         name = COALESCE($1, name),
         location = COALESCE($2, location),
         address = COALESCE($3, address),
         latitude = COALESCE($4, latitude),
         longitude = COALESCE($5, longitude),
         geofence_radius_meters = COALESCE($6, geofence_radius_meters),
         geofence_enabled = COALESCE($7, geofence_enabled),
         status = COALESCE($8, status),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *;`,
      [data.name, data.location, data.address, data.latitude, data.longitude, data.geofenceRadiusMeters, data.geofenceEnabled, data.status, id]
    );

    await AuditService.log({
      userId,
      action: 'UPDATE',
      module: 'unit',
      recordId: id,
      oldValue: old,
      newValue: res.rows[0]
    });

    return res.rows[0];
  }

  static async getDepartments(companyId: string) {
    const res = await db.query(
      `SELECT d.*, COUNT(e.id) as employee_count
       FROM departments d
       LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'ACTIVE'
       WHERE d.company_id = $1
       GROUP BY d.id
       ORDER BY d.name ASC;`,
      [companyId]
    );
    return res.rows;
  }

  static async getDesignations(companyId: string) {
    const res = await db.query(
      `SELECT * FROM designations WHERE company_id = $1 ORDER BY title ASC;`,
      [companyId]
    );
    return res.rows;
  }
}
