import test from 'node:test';
import assert from 'node:assert/strict';
import { FaceService } from '../src/modules/face/face.service.js';
import { DeviceService } from '../src/modules/device/device.service.js';
import { AttendanceService } from '../src/modules/attendance/attendance.service.js';
import { calculateHaversineDistance, verifyGeofence } from '../src/modules/attendance/geofence.util.js';
import { faceProvider } from '../src/modules/face/face.provider.js';
import { db } from '../src/database/db.js';

test('BPF Payroll Phase 2: Face Biometric Engine & AES-256 Storage', async (t) => {
  // Find test employee BPF001
  const empRes = await db.query(`SELECT id, employee_code FROM employees WHERE employee_code = 'BPF001';`);
  assert.ok(empRes.rows.length > 0);
  const empId = empRes.rows[0].id;

  // Generate synthetic 128-d biometric vector
  const testVector = new Array(128).fill(0).map((_, i) => Math.sin(i * 0.1));

  await t.test('Enroll 128-d face vector with consent and quality check', async () => {
    const enrollResult = await FaceService.enrollFace({
      employeeId: empId,
      embedding: testVector,
      qualityScore: 0.95,
      consentObtained: true,
      deviceInfo: 'Test Pixel 8'
    });

    assert.equal(enrollResult.success, true);
    assert.equal(enrollResult.enrollment.embedding_dimension, 128);

    // Verify stored encrypted embedding in database
    const dbRes = await db.query(`SELECT encrypted_embedding FROM face_enrollments WHERE employee_id = $1;`, [empId]);
    assert.ok(dbRes.rows.length > 0);
    const encStr = dbRes.rows[0].encrypted_embedding;
    assert.ok(encStr.includes(':')); // Format: iv:authTag:ciphertext

    // Verify employee table updated
    const empCheck = await db.query(`SELECT face_enrolled FROM employees WHERE id = $1;`, [empId]);
    assert.equal(empCheck.rows[0].face_enrolled, true);
  });

  await t.test('Face Verification: Matching probe vector succeeds (score >= 0.82)', async () => {
    // Probe vector with tiny jitter (~0.98 cosine similarity)
    const matchingProbe = testVector.map((v) => v + (Math.random() - 0.5) * 0.02);
    const verifyResult = await FaceService.verifyFace({
      employeeId: empId,
      probeEmbedding: matchingProbe,
      deviceId: 'DEV-TEST-001'
    });

    assert.equal(verifyResult.verified, true);
    assert.ok(verifyResult.similarityScore >= 0.82);
  });

  await t.test('Face Verification: Different person vector rejected (score < 0.82)', async () => {
    // Orthogonal / inverted vector
    const differentPersonProbe = testVector.map((_, i) => Math.cos(i * 3.5 + 10));
    const verifyResult = await FaceService.verifyFace({
      employeeId: empId,
      probeEmbedding: differentPersonProbe,
      deviceId: 'DEV-TEST-001'
    });

    assert.equal(verifyResult.verified, false);
    assert.ok(verifyResult.similarityScore < 0.82);
  });
});

test('BPF Payroll Phase 2: Device Management & Status Enforcement', async (t) => {
  const empRes = await db.query(`SELECT id FROM employees WHERE employee_code = 'BPF001';`);
  const empId = empRes.rows[0].id;
  const testDevId = 'DEV-AUTOMATION-TEST-X1';

  await t.test('Auto-register and verify new device', async () => {
    const check = await DeviceService.verifyDeviceAllowed(empId, testDevId);
    assert.equal(check.allowed, true);
    assert.equal(check.status, 'APPROVED');
  });

  await t.test('Reject attendance from blocked device', async () => {
    await db.query(`UPDATE devices SET status = 'BLOCKED' WHERE employee_id = $1 AND device_id = $2;`, [empId, testDevId]);
    const check = await DeviceService.verifyDeviceAllowed(empId, testDevId);
    assert.equal(check.allowed, false);
    assert.equal(check.status, 'BLOCKED');

    // Restore device to APPROVED for subsequent tests
    await db.query(`UPDATE devices SET status = 'APPROVED' WHERE employee_id = $1 AND device_id = $2;`, [empId, testDevId]);
  });
});

test('BPF Payroll Phase 2: GPS Geofencing (Haversine Algorithm)', async (t) => {
  // Mumbai Head Office: 19.1176, 72.9060, Radius: 100m
  const mumbaiLat = 19.1176;
  const mumbaiLon = 72.9060;

  await t.test('Coordinates within 30m of unit center accepted', () => {
    // Offset by ~30 meters
    const nearLat = mumbaiLat + 0.0002;
    const nearLon = mumbaiLon + 0.0002;

    const result = verifyGeofence(nearLat, nearLon, mumbaiLat, mumbaiLon, 100, 10);
    assert.equal(result.withinGeofence, true);
    assert.ok(result.distanceMeters <= 100);
  });

  await t.test('Coordinates 5km away rejected with violation', () => {
    const farLat = mumbaiLat + 0.05; // ~5.5 km
    const farLon = mumbaiLon + 0.05;

    const result = verifyGeofence(farLat, farLon, mumbaiLat, mumbaiLon, 100, 10);
    assert.equal(result.withinGeofence, false);
    assert.ok(result.distanceMeters > 1000);
    assert.ok(result.message?.includes('outside permitted area'));
  });
});

test('BPF Payroll Phase 2: Shift-Aware IN & OUT Attendance Workflow', async (t) => {
  // Use employee BPF002 for punch tests
  const empRes = await db.query(
    `SELECT e.id, e.company_id, e.unit_id, u.latitude, u.longitude, u.geofence_radius_meters
     FROM employees e
     JOIN units u ON e.unit_id = u.id
     WHERE e.employee_code = 'BPF002';`
  );
  assert.ok(empRes.rows.length > 0);
  const emp = empRes.rows[0];

  const testDate = '2026-09-17'; // Future distinct date for testing
  // Clean up any test attendance on this date
  await db.query(`DELETE FROM attendance WHERE employee_id = $1 AND attendance_date = $2;`, [emp.id, testDate]);

  await t.test('Punch OUT before IN is blocked', async () => {
    await assert.rejects(
      async () => {
        await AttendanceService.punchOut({
          employeeId: emp.id,
          latitude: emp.latitude,
          longitude: emp.longitude,
          deviceId: 'DEV-TEST-002',
          timestamp: `${testDate}T18:00:00+05:30`,
          faceSimilarityScore: 0.95
        });
      },
      (err: any) => {
        assert.equal(err.code, 'MISSING_IN_PUNCH');
        return true;
      }
    );
  });

  await t.test('Punch IN at scheduled time creates valid attendance', async () => {
    // General shift starts at 09:00, punch in at 09:05 (within 15m grace)
    const inResult = await AttendanceService.punchIn({
      employeeId: emp.id,
      latitude: emp.latitude,
      longitude: emp.longitude,
      deviceId: 'DEV-TEST-002',
      timestamp: `${testDate}T09:05:00+05:30`,
      faceSimilarityScore: 0.95
    });

    assert.equal(inResult.success, true);
    assert.equal(inResult.attendance.late_minutes, 0);
    assert.equal(inResult.attendance.status, 'PRESENT');
  });

  await t.test('Duplicate IN punch on same date is blocked', async () => {
    await assert.rejects(
      async () => {
        await AttendanceService.punchIn({
          employeeId: emp.id,
          latitude: emp.latitude,
          longitude: emp.longitude,
          deviceId: 'DEV-TEST-002',
          timestamp: `${testDate}T09:10:00+05:30`,
          faceSimilarityScore: 0.95
        });
      },
      (err: any) => {
        assert.equal(err.code, 'ATTENDANCE_DUPLICATE');
        return true;
      }
    );
  });

  await t.test('Punch OUT calculates work hours and final status', async () => {
    // Punch out after 8.5 hours (17:35)
    const outResult = await AttendanceService.punchOut({
      employeeId: emp.id,
      latitude: emp.latitude,
      longitude: emp.longitude,
      deviceId: 'DEV-TEST-002',
      timestamp: `${testDate}T17:35:00+05:30`,
      faceSimilarityScore: 0.95
    });

    assert.equal(outResult.success, true);
    assert.ok(outResult.attendance.total_work_hours >= 8.0);
    assert.equal(outResult.attendance.status, 'PRESENT');
  });
});

test('BPF Payroll Phase 2: Offline Attendance Queue & Idempotent Sync', async (t) => {
  const empRes = await db.query(
    `SELECT e.id, u.latitude, u.longitude FROM employees e JOIN units u ON e.unit_id = u.id WHERE e.employee_code = 'BPF003';`
  );
  const emp = empRes.rows[0];
  const offlineDate = '2026-09-18';
  await db.query(`DELETE FROM attendance WHERE employee_id = $1 AND attendance_date = $2;`, [emp.id, offlineDate]);

  const clientEventIdIn = `OFFLINE-IN-${Date.now()}`;
  const clientEventIdOut = `OFFLINE-OUT-${Date.now()}`;

  const offlineBatch = [
    {
      clientEventId: clientEventIdIn,
      employeeId: emp.id,
      punchType: 'IN' as const,
      eventTimestamp: `${offlineDate}T09:00:00+05:30`,
      latitude: emp.latitude,
      longitude: emp.longitude,
      gpsAccuracy: 10,
      deviceId: 'DEV-OFFLINE-003',
      faceSimilarityScore: 0.95
    },
    {
      clientEventId: clientEventIdOut,
      employeeId: emp.id,
      punchType: 'OUT' as const,
      eventTimestamp: `${offlineDate}T18:00:00+05:30`,
      latitude: emp.latitude,
      longitude: emp.longitude,
      gpsAccuracy: 10,
      deviceId: 'DEV-OFFLINE-003',
      faceSimilarityScore: 0.95
    }
  ];

  await t.test('Process initial offline batch', async () => {
    const syncRes = await AttendanceService.syncOfflinePunches(offlineBatch);
    assert.equal(syncRes.processedCount, 2);
    assert.equal(syncRes.duplicateCount, 0);
    assert.equal(syncRes.failedCount, 0);

    // Verify record in attendance table
    const attCheck = await db.query(
      `SELECT in_time, out_time, total_work_hours FROM attendance WHERE employee_id = $1 AND attendance_date = $2;`,
      [emp.id, offlineDate]
    );
    assert.equal(attCheck.rows.length, 1);
    assert.ok(attCheck.rows[0].in_time);
    assert.ok(attCheck.rows[0].out_time);
  });

  await t.test('Re-submitting same batch is idempotent (skipped as duplicates)', async () => {
    const duplicateSyncRes = await AttendanceService.syncOfflinePunches(offlineBatch);
    assert.equal(duplicateSyncRes.processedCount, 0);
    assert.equal(duplicateSyncRes.duplicateCount, 2);
    assert.equal(duplicateSyncRes.failedCount, 0);

    // Attendance records should still be exactly 1
    const countCheck = await db.query(
      `SELECT COUNT(*) as count FROM attendance WHERE employee_id = $1 AND attendance_date = $2;`,
      [emp.id, offlineDate]
    );
    assert.equal(parseInt(countCheck.rows[0].count, 10), 1);
  });

  await t.test('Attendance History returns recorded punches', async () => {
    const history = await AttendanceService.getMyHistory(emp.id, 10);
    assert.ok(history.length > 0);
    const rec = history.find((h) => h.attendance_date === offlineDate);
    assert.ok(rec);
    assert.equal(rec.status, 'PRESENT');
  });
});
