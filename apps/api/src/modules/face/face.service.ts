import { db } from '../../database/db.js';
import { faceProvider } from './face.provider.js';
import { config } from '../../config/index.js';
import { AuditService } from '../audit/audit.service.js';

export interface EnrollFaceParams {
  employeeId: string;
  embedding: number[];
  qualityScore: number;
  faceCount?: number;
  modelVersion?: string;
  deviceInfo?: string;
  enrolledBy?: string;
  consentObtained: boolean;
  ipAddress?: string;
}

export interface VerifyFaceParams {
  employeeId: string;
  probeEmbedding: number[];
  qualityScore?: number;
  faceCount?: number;
  deviceId?: string;
}

export class FaceService {
  /**
   * Enrolls employee face biometric template
   */
  static async enrollFace(params: EnrollFaceParams) {
    // 1. Mandatory Biometric Consent
    if (!params.consentObtained) {
      throw { statusCode: 400, message: 'Employee biometric consent is required for enrollment', code: 'CONSENT_REQUIRED' };
    }

    // 2. Validate Single Face and Quality
    const qualityCheck = faceProvider.validateFaceQuality(
      params.qualityScore,
      params.faceCount ?? 1
    );
    if (!qualityCheck.valid) {
      throw { statusCode: 400, message: qualityCheck.error, code: 'FACE_QUALITY_REJECTED' };
    }

    // 3. Verify Employee Existence
    const empRes = await db.query(
      `SELECT id, company_id, employee_code, full_name, status FROM employees WHERE id = $1;`,
      [params.employeeId]
    );
    if (empRes.rows.length === 0) {
      throw { statusCode: 404, message: 'Employee not found', code: 'EMPLOYEE_NOT_FOUND' };
    }
    const emp = empRes.rows[0];
    if (emp.status !== 'ACTIVE') {
      throw { statusCode: 400, message: 'Cannot enroll face for inactive employee', code: 'EMPLOYEE_INACTIVE' };
    }

    // 4. Normalize & Encrypt Vector
    const normalizedVector = faceProvider.normalizeVector(params.embedding);
    const encryptedEmbedding = faceProvider.encryptEmbedding(normalizedVector);

    // 5. Store in Database
    const result = await db.transaction(async (tx) => {
      const enrollRes = await tx.query(
        `INSERT INTO face_enrollments (
          employee_id, encrypted_embedding, embedding_dimension, quality_score,
          model_version, device_info, enrolled_by, enrolled_at, consent_obtained, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, true, 'ACTIVE')
        ON CONFLICT (employee_id)
        DO UPDATE SET
          encrypted_embedding = EXCLUDED.encrypted_embedding,
          quality_score = EXCLUDED.quality_score,
          model_version = EXCLUDED.model_version,
          device_info = EXCLUDED.device_info,
          enrolled_by = EXCLUDED.enrolled_by,
          enrolled_at = CURRENT_TIMESTAMP,
          status = 'ACTIVE'
        RETURNING id, employee_id, embedding_dimension, quality_score, model_version, enrolled_at, status;`,
        [
          emp.id,
          encryptedEmbedding,
          normalizedVector.length,
          params.qualityScore,
          params.modelVersion || 'mediapipe-facemesh-v1',
          params.deviceInfo || 'Mobile App',
          params.enrolledBy || null
        ]
      );

      // Update Employee Flag
      await tx.query(
        `UPDATE employees SET face_enrolled = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1;`,
        [emp.id]
      );

      await AuditService.log({
        userId: params.enrolledBy || undefined,
        action: 'ENROLL_FACE',
        module: 'face',
        recordId: emp.id,
        deviceInfo: params.deviceInfo,
        ipAddress: params.ipAddress
      });

      return enrollRes.rows[0];
    });

    return {
      success: true,
      message: 'Face biometric template enrolled securely',
      enrollment: result
    };
  }

  /**
   * Verifies a probe face vector against the enrolled template
   */
  static async verifyFace(params: VerifyFaceParams): Promise<{
    verified: boolean;
    similarityScore: number;
    threshold: number;
    employeeId: string;
    employeeName: string;
    message: string;
  }> {
    // 1. Fetch Active Enrollment
    const res = await db.query(
      `SELECT fe.encrypted_embedding, fe.status, e.id as employee_id, e.full_name, e.status as emp_status
       FROM face_enrollments fe
       JOIN employees e ON fe.employee_id = e.id
       WHERE fe.employee_id = $1 AND fe.status = 'ACTIVE';`,
      [params.employeeId]
    );

    if (res.rows.length === 0) {
      return {
        verified: false,
        similarityScore: 0.0,
        threshold: config.faceThreshold,
        employeeId: params.employeeId,
        employeeName: '',
        message: 'No active face biometric template found for this employee. Please enroll first.'
      };
    }

    const { encrypted_embedding, full_name, emp_status } = res.rows[0];
    if (emp_status !== 'ACTIVE') {
      return {
        verified: false,
        similarityScore: 0.0,
        threshold: config.faceThreshold,
        employeeId: params.employeeId,
        employeeName: full_name,
        message: 'Employee is inactive in records'
      };
    }

    // 2. Decrypt Enrolled Vector
    const enrolledVector = faceProvider.decryptEmbedding(encrypted_embedding);
    const normalizedProbe = faceProvider.normalizeVector(params.probeEmbedding);

    // 3. Compute Cosine Similarity
    const similarityScore = faceProvider.calculateCosineSimilarity(normalizedProbe, enrolledVector);
    const threshold = config.faceThreshold;
    const verified = similarityScore >= threshold;

    return {
      verified,
      similarityScore: Math.round(similarityScore * 1000) / 1000,
      threshold,
      employeeId: params.employeeId,
      employeeName: full_name,
      message: verified
        ? 'Face verification successful'
        : `Face confidence score (${(similarityScore * 100).toFixed(1)}%) below required threshold (${(threshold * 100).toFixed(1)}%)`
    };
  }

  /**
   * Returns enrollment status for an employee
   */
  static async getEnrollmentStatus(employeeId: string) {
    const res = await db.query(
      `SELECT fe.id, fe.employee_id, fe.embedding_dimension, fe.quality_score, fe.model_version,
              fe.enrolled_at, fe.status, fe.device_info, e.face_enrolled, e.full_name
       FROM employees e
       LEFT JOIN face_enrollments fe ON fe.employee_id = e.id
       WHERE e.id = $1;`,
      [employeeId]
    );

    if (res.rows.length === 0) {
      throw { statusCode: 404, message: 'Employee not found', code: 'EMPLOYEE_NOT_FOUND' };
    }

    const row = res.rows[0];
    return {
      enrolled: !!row.id && row.status === 'ACTIVE',
      employeeId: row.employee_id || employeeId,
      employeeName: row.full_name,
      qualityScore: row.quality_score,
      modelVersion: row.model_version,
      enrolledAt: row.enrolled_at,
      status: row.status || 'NOT_ENROLLED'
    };
  }

  /**
   * Disables or revokes biometric enrollment
   */
  static async disableFace(employeeId: string, userId?: string) {
    await db.transaction(async (tx) => {
      await tx.query(
        `UPDATE face_enrollments SET status = 'REVOKED' WHERE employee_id = $1;`,
        [employeeId]
      );
      await tx.query(
        `UPDATE employees SET face_enrolled = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1;`,
        [employeeId]
      );
      await AuditService.log({
        userId,
        action: 'REVOKE_FACE',
        module: 'face',
        recordId: employeeId
      });
    });

    return { success: true, message: 'Face biometric template disabled' };
  }

  /**
   * Identifies an employee from a probe embedding (1:N search within company)
   */
  static async identifyFace(companyId: string, probeEmbedding: number[]): Promise<{
    matched: boolean;
    employee?: {
      id: string;
      employeeCode: string;
      fullName: string;
      unitId: string;
    };
    similarityScore: number;
    threshold: number;
    message: string;
  }> {
    const res = await db.query(
      `SELECT fe.encrypted_embedding, e.id, e.employee_code, e.full_name, e.unit_id
       FROM face_enrollments fe
       JOIN employees e ON fe.employee_id = e.id
       WHERE e.company_id = $1 AND fe.status = 'ACTIVE' AND e.status = 'ACTIVE';`,
      [companyId]
    );

    if (res.rows.length === 0) {
      return {
        matched: false,
        similarityScore: 0,
        threshold: config.faceThreshold,
        message: 'No active face enrollments found for this company'
      };
    }

    const normalizedProbe = faceProvider.normalizeVector(probeEmbedding);
    let bestScore = -1;
    let bestMatch: any = null;

    for (const row of res.rows) {
      try {
        const enrolledVector = faceProvider.decryptEmbedding(row.encrypted_embedding);
        const score = faceProvider.calculateCosineSimilarity(normalizedProbe, enrolledVector);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = row;
        }
      } catch (err) {
        continue;
      }
    }

    const threshold = config.faceThreshold;
    if (bestScore >= threshold && bestMatch) {
      return {
        matched: true,
        employee: {
          id: bestMatch.id,
          employeeCode: bestMatch.employee_code,
          fullName: bestMatch.full_name,
          unitId: bestMatch.unit_id
        },
        similarityScore: Math.round(bestScore * 1000) / 1000,
        threshold,
        message: `Recognized: ${bestMatch.full_name} (${bestMatch.employee_code})`
      };
    }

    return {
      matched: false,
      similarityScore: Math.max(0, Math.round(bestScore * 1000) / 1000),
      threshold,
      message: 'No matching face found with sufficient confidence'
    };
  }
}
