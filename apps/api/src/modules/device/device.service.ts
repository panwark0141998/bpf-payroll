import { db } from '../../database/db.js';
import { AuditService } from '../audit/audit.service.js';

export class DeviceService {
  static async getDevices(companyId: string, status?: string) {
    const params: any[] = [companyId];
    let query = `
      SELECT d.*, e.employee_code, e.full_name as employee_name, e.mobile, u.name as unit_name
      FROM devices d
      JOIN employees e ON d.employee_id = e.id
      LEFT JOIN units u ON e.unit_id = u.id
      WHERE e.company_id = $1
    `;

    if (status) {
      params.push(status);
      query += ` AND d.status = $2`;
    }

    query += ` ORDER BY d.last_active DESC;`;

    const res = await db.query(query, params);
    return res.rows;
  }

  static async updateDeviceStatus(deviceId: string, status: 'APPROVED' | 'DISABLED' | 'BLOCKED', actorId?: string) {
    const res = await db.query(
      `UPDATE devices SET status = $1, approved_by = $2 WHERE id = $3 RETURNING *;`,
      [status, actorId || null, deviceId]
    );

    if (res.rows.length === 0) {
      throw { statusCode: 404, message: 'Device registration not found', code: 'DEVICE_NOT_FOUND' };
    }

    await AuditService.log({
      userId: actorId,
      action: 'UPDATE_DEVICE_STATUS',
      module: 'device',
      recordId: deviceId,
      newValue: { status }
    });

    return res.rows[0];
  }

  static async verifyDeviceAllowed(employeeId: string, deviceId: string) {
    const res = await db.query(
      `SELECT * FROM devices WHERE employee_id = $1 AND device_id = $2;`,
      [employeeId, deviceId]
    );

    if (res.rows.length === 0) {
      // Auto-register pending device if first time seen
      await db.query(
        `INSERT INTO devices (employee_id, device_id, status)
         VALUES ($1, $2, 'APPROVED')
         ON CONFLICT (employee_id, device_id) DO NOTHING;`,
        [employeeId, deviceId]
      );
      return { allowed: true, status: 'APPROVED' };
    }

    const dev = res.rows[0];
    if (dev.status === 'BLOCKED' || dev.status === 'DISABLED') {
      return { allowed: false, status: dev.status, message: `Device ${deviceId} is ${dev.status.toLowerCase()}` };
    }

    return { allowed: true, status: dev.status };
  }
}
