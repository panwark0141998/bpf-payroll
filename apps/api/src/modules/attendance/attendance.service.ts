import { db } from '../../database/db.js';
import { verifyGeofence } from './geofence.util.js';
import { FaceService } from '../face/face.service.js';
import { DeviceService } from '../device/device.service.js';
import { AuditService } from '../audit/audit.service.js';
import { config } from '../../config/index.js';

export interface PunchInParams {
  employeeId: string;
  latitude: number;
  longitude: number;
  gpsAccuracy?: number;
  deviceId: string;
  timestamp?: string; // Device timestamp (optional, defaults to now)
  faceEmbedding?: number[];
  faceSimilarityScore?: number;
  clientEventId?: string;
  source?: 'MOBILE_APP' | 'DESKTOP_MANUAL' | 'BIOMETRIC_DEVICE';
}

export interface PunchOutParams {
  employeeId: string;
  latitude: number;
  longitude: number;
  gpsAccuracy?: number;
  deviceId: string;
  timestamp?: string;
  faceEmbedding?: number[];
  faceSimilarityScore?: number;
  clientEventId?: string;
  source?: 'MOBILE_APP' | 'DESKTOP_MANUAL' | 'BIOMETRIC_DEVICE';
}

export interface OfflineSyncItem {
  clientEventId: string;
  employeeId: string;
  punchType: 'IN' | 'OUT';
  eventTimestamp: string;
  latitude?: number;
  longitude?: number;
  gpsAccuracy?: number;
  deviceId: string;
  faceEmbedding?: number[];
  faceSimilarityScore?: number;
}

export class AttendanceService {
  /**
   * IN Attendance Punch Workflow
   */
  static async punchIn(params: PunchInParams) {
    const punchTimestamp = params.timestamp ? new Date(params.timestamp) : new Date();
    const punchDate = punchTimestamp.toLocaleDateString('en-CA', { timeZone: config.timezone });
    const punchTimeStr = punchTimestamp.toLocaleTimeString('en-GB', { timeZone: config.timezone, hour12: false });

    // 1. Fetch Employee and Unit Details
    const empRes = await db.query(
      `SELECT e.id, e.company_id, e.unit_id, e.employee_code, e.full_name, e.work_status, e.status, e.face_enrolled,
              u.latitude as unit_lat, u.longitude as unit_lon, u.geofence_radius_meters, u.geofence_enabled, u.name as unit_name
       FROM employees e
       JOIN units u ON e.unit_id = u.id
       WHERE e.id = $1;`,
      [params.employeeId]
    );

    if (empRes.rows.length === 0) {
      throw { statusCode: 404, message: 'Employee not found', code: 'EMPLOYEE_NOT_FOUND' };
    }
    const emp = empRes.rows[0];

    if (emp.status !== 'ACTIVE') {
      throw { statusCode: 403, message: 'Employee is not active in records', code: 'EMPLOYEE_INACTIVE' };
    }

    // 2. Device Validation
    const devCheck = await DeviceService.verifyDeviceAllowed(emp.id, params.deviceId);
    if (!devCheck.allowed) {
      throw { statusCode: 403, message: devCheck.message || 'Device not authorized', code: 'DEVICE_NOT_AUTHORIZED' };
    }

    // 3. Geofence Verification
    // Enforce geofence if unit enables it AND employee is not strictly REMOTE / FIELD
    if (emp.geofence_enabled && emp.work_status !== 'REMOTE' && emp.work_status !== 'FIELD') {
      const geoResult = verifyGeofence(
        params.latitude,
        params.longitude,
        emp.unit_lat,
        emp.unit_lon,
        emp.geofence_radius_meters,
        params.gpsAccuracy || 0
      );

      if (!geoResult.withinGeofence) {
        throw {
          statusCode: 400,
          message: geoResult.message,
          code: 'GEOFENCE_VIOLATION',
          details: { distance: geoResult.distanceMeters, allowed: geoResult.allowedRadiusMeters }
        };
      }
    }

    // 4. Biometric Face Verification
    let faceVerified = false;
    let similarityScore = params.faceSimilarityScore || 0.0;

    if (emp.face_enrolled) {
      if (params.faceEmbedding && params.faceEmbedding.length >= 128) {
        const verifyRes = await FaceService.verifyFace({
          employeeId: emp.id,
          probeEmbedding: params.faceEmbedding,
          deviceId: params.deviceId
        });

        faceVerified = verifyRes.verified;
        similarityScore = verifyRes.similarityScore;

        if (!faceVerified) {
          throw {
            statusCode: 400,
            message: verifyRes.message,
            code: 'FACE_VERIFICATION_FAILED',
            details: { similarityScore, threshold: verifyRes.threshold }
          };
        }
      } else if (params.faceSimilarityScore !== undefined) {
        faceVerified = params.faceSimilarityScore >= 0.82;
        if (!faceVerified) {
          throw { statusCode: 400, message: 'Face similarity score below threshold', code: 'FACE_VERIFICATION_FAILED' };
        }
      } else {
        throw {
          statusCode: 400,
          message: 'Face verification is required for this employee but no biometric data provided',
          code: 'FACE_BIOMETRIC_REQUIRED'
        };
      }
    } else {
      faceVerified = true; // Auto-pass if not yet enrolled
    }

    // 5. Duplicate Check
    const existingPunchRes = await db.query(
      `SELECT id, in_time, out_time FROM attendance WHERE employee_id = $1 AND attendance_date = $2;`,
      [emp.id, punchDate]
    );

    if (existingPunchRes.rows.length > 0 && existingPunchRes.rows[0].in_time) {
      const existingIn = existingPunchRes.rows[0].in_time;
      throw {
        statusCode: 400,
        message: `Attendance already marked for today (IN at ${existingIn.slice(0, 5)})`,
        code: 'ATTENDANCE_DUPLICATE'
      };
    }

    // 6. Resolve Shift & Calculate Late Minutes
    const shiftRes = await db.query(
      `SELECT s.*
       FROM shift_assignments sa
       JOIN shifts s ON sa.shift_id = s.id
       WHERE sa.employee_id = $1 AND sa.start_date <= $2 AND (sa.end_date IS NULL OR sa.end_date >= $2)
       ORDER BY sa.created_at DESC LIMIT 1;`,
      [emp.id, punchDate]
    );

    let shift = shiftRes.rows[0];
    if (!shift) {
      // Fallback to default general shift
      const defaultShiftRes = await db.query(
        `SELECT * FROM shifts WHERE company_id = $1 AND status = 'ACTIVE' ORDER BY created_at ASC LIMIT 1;`,
        [emp.company_id]
      );
      shift = defaultShiftRes.rows[0];
    }

    let lateMinutes = 0;
    let attendanceStatus = 'PRESENT';

    if (shift && shift.start_time) {
      const [sHour, sMin] = shift.start_time.split(':').map(Number);
      const shiftStartMinutes = sHour * 60 + sMin;

      const [pHour, pMin] = punchTimeStr.split(':').map(Number);
      const punchMinutes = pHour * 60 + pMin;

      const gracePeriod = shift.grace_period_minutes || 15;
      if (punchMinutes > shiftStartMinutes + gracePeriod) {
        lateMinutes = punchMinutes - shiftStartMinutes;
        attendanceStatus = 'LATE';
      }
    }

    // 7. Upsert Attendance Record
    const result = await db.query(
      `INSERT INTO attendance (
        employee_id, company_id, unit_id, shift_id, attendance_date,
        in_time, in_timestamp, late_minutes, status, in_latitude, in_longitude,
        in_gps_accuracy, in_device_id, face_verified, face_similarity_score, source, sync_status
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, 'SYNCED'
      )
      ON CONFLICT (employee_id, attendance_date)
      DO UPDATE SET
        in_time = EXCLUDED.in_time,
        in_timestamp = EXCLUDED.in_timestamp,
        late_minutes = EXCLUDED.late_minutes,
        status = EXCLUDED.status,
        in_latitude = EXCLUDED.in_latitude,
        in_longitude = EXCLUDED.in_longitude,
        in_gps_accuracy = EXCLUDED.in_gps_accuracy,
        in_device_id = EXCLUDED.in_device_id,
        face_verified = EXCLUDED.face_verified,
        face_similarity_score = EXCLUDED.face_similarity_score,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;`,
      [
        emp.id,
        emp.company_id,
        emp.unit_id,
        shift?.id || null,
        punchDate,
        punchTimeStr,
        punchTimestamp,
        lateMinutes,
        attendanceStatus,
        params.latitude,
        params.longitude,
        params.gpsAccuracy || 0,
        params.deviceId,
        faceVerified,
        similarityScore,
        params.source || 'MOBILE_APP'
      ]
    );

    // Update device active timestamp
    await db.query(`UPDATE devices SET last_active = CURRENT_TIMESTAMP WHERE employee_id = $1 AND device_id = $2;`, [emp.id, params.deviceId]);

    await AuditService.log({
      action: 'PUNCH_IN',
      module: 'attendance',
      recordId: result.rows[0].id,
      deviceInfo: params.deviceId,
      newValue: { date: punchDate, inTime: punchTimeStr, status: attendanceStatus, lateMinutes }
    });

    return {
      success: true,
      message: lateMinutes > 0
        ? `Attendance marked successfully (IN - ${punchTimeStr.slice(0, 5)}, Late: ${lateMinutes} mins)`
        : `Attendance marked successfully (IN - ${punchTimeStr.slice(0, 5)})`,
      attendance: result.rows[0]
    };
  }

  /**
   * OUT Attendance Punch Workflow
   */
  static async punchOut(params: PunchOutParams) {
    const punchTimestamp = params.timestamp ? new Date(params.timestamp) : new Date();
    const punchDate = punchTimestamp.toLocaleDateString('en-CA', { timeZone: config.timezone });
    const punchTimeStr = punchTimestamp.toLocaleTimeString('en-GB', { timeZone: config.timezone, hour12: false });

    // 1. Fetch Existing Record for today
    const attRes = await db.query(
      `SELECT a.*, e.work_status, e.face_enrolled,
              u.latitude as unit_lat, u.longitude as unit_lon, u.geofence_radius_meters, u.geofence_enabled,
              s.start_time as s_start, s.end_time as s_end, s.half_day_work_hours, s.full_day_work_hours,
              s.early_exit_threshold_minutes, s.overtime_min_minutes
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       JOIN units u ON a.unit_id = u.id
       LEFT JOIN shifts s ON a.shift_id = s.id
       WHERE a.employee_id = $1 AND a.attendance_date = $2;`,
      [params.employeeId, punchDate]
    );

    if (attRes.rows.length === 0 || !attRes.rows[0].in_time) {
      throw {
        statusCode: 400,
        message: 'Cannot mark OUT before IN. No IN punch recorded for today.',
        code: 'MISSING_IN_PUNCH'
      };
    }

    const att = attRes.rows[0];

    // 2. Geofence Verification
    if (att.geofence_enabled && att.work_status !== 'REMOTE' && att.work_status !== 'FIELD') {
      const geoResult = verifyGeofence(
        params.latitude,
        params.longitude,
        att.unit_lat,
        att.unit_lon,
        att.geofence_radius_meters,
        params.gpsAccuracy || 0
      );
      if (!geoResult.withinGeofence) {
        throw {
          statusCode: 400,
          message: geoResult.message,
          code: 'GEOFENCE_VIOLATION'
        };
      }
    }

    // 3. Face Verification
    let faceVerified = att.face_verified;
    let similarityScore = params.faceSimilarityScore || att.face_similarity_score || 0.0;

    if (att.face_enrolled) {
      if (params.faceEmbedding && params.faceEmbedding.length >= 128) {
        const verifyRes = await FaceService.verifyFace({
          employeeId: params.employeeId,
          probeEmbedding: params.faceEmbedding,
          deviceId: params.deviceId
        });
        if (!verifyRes.verified) {
          throw {
            statusCode: 400,
            message: verifyRes.message,
            code: 'FACE_VERIFICATION_FAILED'
          };
        }
        faceVerified = true;
        similarityScore = verifyRes.similarityScore;
      }
    }

    // 4. Calculate Work Hours & Early Exit
    const inDateTime = new Date(att.in_timestamp);
    const outDateTime = punchTimestamp;
    const diffMs = outDateTime.getTime() - inDateTime.getTime();
    const totalWorkHours = Math.max(0, Math.round((diffMs / 3600000) * 100) / 100);

    let earlyExitMinutes = 0;
    if (att.s_end) {
      const [eHour, eMin] = att.s_end.split(':').map(Number);
      const shiftEndMinutes = eHour * 60 + eMin;

      const [pHour, pMin] = punchTimeStr.split(':').map(Number);
      const punchMinutes = pHour * 60 + pMin;

      const threshold = att.early_exit_threshold_minutes || 30;
      if (punchMinutes < shiftEndMinutes - threshold) {
        earlyExitMinutes = shiftEndMinutes - punchMinutes;
      }
    }

    // Status evaluation:
    const fullDayHours = att.full_day_work_hours || 8.0;
    const halfDayHours = att.half_day_work_hours || 4.0;
    let finalStatus = att.status;

    if (totalWorkHours >= fullDayHours) {
      finalStatus = att.late_minutes > 0 ? 'LATE' : 'PRESENT';
    } else if (totalWorkHours >= halfDayHours) {
      finalStatus = 'HALF_DAY';
    } else {
      finalStatus = 'HALF_DAY';
    }

    // Overtime evaluation
    let overtimeHours = 0.0;
    const otMinMins = att.overtime_min_minutes || 60;
    if (totalWorkHours > fullDayHours + otMinMins / 60) {
      overtimeHours = Math.round((totalWorkHours - fullDayHours) * 100) / 100;
    }

    // 5. Update Attendance Record
    const result = await db.query(
      `UPDATE attendance SET
         out_time = $1,
         out_timestamp = $2,
         total_work_hours = $3,
         overtime_hours = $4,
         early_exit_minutes = $5,
         status = $6,
         out_latitude = $7,
         out_longitude = $8,
         out_gps_accuracy = $9,
         out_device_id = $10,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *;`,
      [
        punchTimeStr,
        outDateTime,
        totalWorkHours,
        overtimeHours,
        earlyExitMinutes,
        finalStatus,
        params.latitude,
        params.longitude,
        params.gpsAccuracy || 0,
        params.deviceId,
        att.id
      ]
    );

    await AuditService.log({
      action: 'PUNCH_OUT',
      module: 'attendance',
      recordId: att.id,
      deviceInfo: params.deviceId,
      newValue: { outTime: punchTimeStr, totalWorkHours, overtimeHours, earlyExitMinutes, status: finalStatus }
    });

    return {
      success: true,
      message: `Attendance marked successfully (OUT - ${punchTimeStr.slice(0, 5)}, Work Hours: ${totalWorkHours} hrs)`,
      attendance: result.rows[0]
    };
  }

  /**
   * Offline Attendance Batch Synchronization Queue
   * Guarantees idempotency and chronological execution
   */
  static async syncOfflinePunches(punches: OfflineSyncItem[]) {
    // Sort punches chronologically by eventTimestamp
    const sorted = [...punches].sort(
      (a, b) => new Date(a.eventTimestamp).getTime() - new Date(b.eventTimestamp).getTime()
    );

    let processedCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;
    const results: any[] = [];

    for (const p of sorted) {
      // 1. Check if clientEventId was already processed
      const existingQueueRes = await db.query(
        `SELECT id, sync_status, error_message FROM attendance_sync_queue WHERE client_event_id = $1;`,
        [p.clientEventId]
      );

      if (existingQueueRes.rows.length > 0) {
        duplicateCount++;
        results.push({
          clientEventId: p.clientEventId,
          status: 'DUPLICATE_SKIPPED',
          message: 'Punch already processed previously'
        });
        continue;
      }

      // Record in queue as PENDING
      await db.query(
        `INSERT INTO attendance_sync_queue (
          client_event_id, employee_id, punch_type, event_timestamp, latitude, longitude, gps_accuracy, device_id, sync_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING');`,
        [p.clientEventId, p.employeeId, p.punchType, p.eventTimestamp, p.latitude || null, p.longitude || null, p.gpsAccuracy || 0, p.deviceId]
      );

      try {
        if (p.punchType === 'IN') {
          await this.punchIn({
            employeeId: p.employeeId,
            latitude: p.latitude || 0,
            longitude: p.longitude || 0,
            gpsAccuracy: p.gpsAccuracy,
            deviceId: p.deviceId,
            timestamp: p.eventTimestamp,
            faceEmbedding: p.faceEmbedding,
            faceSimilarityScore: p.faceSimilarityScore,
            clientEventId: p.clientEventId,
            source: 'MOBILE_APP'
          });
        } else {
          await this.punchOut({
            employeeId: p.employeeId,
            latitude: p.latitude || 0,
            longitude: p.longitude || 0,
            gpsAccuracy: p.gpsAccuracy,
            deviceId: p.deviceId,
            timestamp: p.eventTimestamp,
            faceEmbedding: p.faceEmbedding,
            faceSimilarityScore: p.faceSimilarityScore,
            clientEventId: p.clientEventId,
            source: 'MOBILE_APP'
          });
        }

        // Mark sync queue as PROCESSED
        await db.query(
          `UPDATE attendance_sync_queue SET sync_status = 'PROCESSED', processed_at = CURRENT_TIMESTAMP WHERE client_event_id = $1;`,
          [p.clientEventId]
        );

        processedCount++;
        results.push({ clientEventId: p.clientEventId, status: 'SYNCED' });
      } catch (err: any) {
        failedCount++;
        await db.query(
          `UPDATE attendance_sync_queue SET sync_status = 'REJECTED', error_message = $1, processed_at = CURRENT_TIMESTAMP WHERE client_event_id = $2;`,
          [err.message || 'Sync processing error', p.clientEventId]
        );
        results.push({ clientEventId: p.clientEventId, status: 'FAILED', error: err.message });
      }
    }

    return {
      processedCount,
      duplicateCount,
      failedCount,
      totalReceived: punches.length,
      results
    };
  }

  /**
   * Fetch employee's personal attendance history
   */
  static async getMyHistory(employeeId: string, limit: number = 30) {
    const res = await db.query(
      `SELECT a.id, a.attendance_date::text as attendance_date, a.in_time, a.out_time, a.total_work_hours, a.overtime_hours,
              a.late_minutes, a.early_exit_minutes, a.status, a.face_verified, a.face_similarity_score,
              s.name as shift_name
       FROM attendance a
       LEFT JOIN shifts s ON a.shift_id = s.id
       WHERE a.employee_id = $1
       ORDER BY a.attendance_date DESC
       LIMIT $2;`,
      [employeeId, limit]
    );

    return res.rows;
  }

  /**
   * Live attendance register for Desktop and monitoring
   */
  static async getTodayRegister(companyId: string, unitId?: string) {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: config.timezone });
    const params: any[] = [companyId, today];
    let query = `
      SELECT a.*, a.attendance_date::text as attendance_date, e.employee_code, e.full_name as employee_name, e.mobile,
             d.name as department_name, ds.title as designation_title,
             u.name as unit_name, s.name as shift_name
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      JOIN units u ON a.unit_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations ds ON e.designation_id = ds.id
      LEFT JOIN shifts s ON a.shift_id = s.id
      WHERE e.company_id = $1 AND a.attendance_date = $2
    `;

    if (unitId) {
      params.push(unitId);
      query += ` AND a.unit_id = $3`;
    }

    query += ` ORDER BY a.in_time DESC NULLS LAST;`;

    const res = await db.query(query, params);
    return res.rows;
  }
}
