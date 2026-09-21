import { db } from '../../database/db.js';

export interface CreateAuditLogParams {
  userId?: string;
  action: string;
  module: string;
  recordId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  deviceInfo?: string;
}

export class AuditService {
  static async log(params: CreateAuditLogParams): Promise<void> {
    try {
      await db.query(
        `INSERT INTO audit_logs (
          user_id, action, module, record_id, old_value, new_value, ip_address, device_info
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
        [
          params.userId || null,
          params.action,
          params.module,
          params.recordId || null,
          params.oldValue ? JSON.stringify(params.oldValue) : null,
          params.newValue ? JSON.stringify(params.newValue) : null,
          params.ipAddress || null,
          params.deviceInfo || null
        ]
      );
    } catch (err: any) {
      console.error('[Audit Log Error]', err.message);
      // Non-blocking so business operations do not fail if audit logging fails
    }
  }

  static async getLogs(filters: {
    userId?: string;
    module?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }) {
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    const params: any[] = [];
    const conditions: string[] = [];

    if (filters.userId) {
      params.push(filters.userId);
      conditions.push(`a.user_id = $${params.length}`);
    }
    if (filters.module) {
      params.push(filters.module);
      conditions.push(`a.module = $${params.length}`);
    }
    if (filters.action) {
      params.push(filters.action);
      conditions.push(`a.action = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT COUNT(*) as total FROM audit_logs a ${whereClause};`,
      params
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    params.push(limit);
    params.push(offset);

    const rowsRes = await db.query(
      `SELECT a.*, u.full_name as user_name, u.email as user_email
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length};`,
      params
    );

    return {
      items: rowsRes.rows,
      total,
      limit,
      offset
    };
  }
}
