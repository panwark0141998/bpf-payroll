import { Request, Response, NextFunction } from 'express';
import { FaceService } from './face.service.js';
import { FaceEnrollmentSchema, FaceVerifySchema } from '@bpf/validation';

export class FaceController {
  static async enroll(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = FaceEnrollmentSchema.parse(req.body);
      const result = await FaceService.enrollFace({
        employeeId: validated.employeeId,
        embedding: validated.embedding,
        qualityScore: validated.qualityScore,
        faceCount: req.body.faceCount ?? 1,
        modelVersion: validated.modelVersion,
        deviceInfo: validated.deviceInfo,
        enrolledBy: req.user?.id,
        consentObtained: validated.consentObtained,
        ipAddress: req.ip
      });

      return res.status(201).json({
        success: true,
        message: result.message,
        data: result.enrollment
      });
    } catch (err) {
      next(err);
    }
  }

  static async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = FaceVerifySchema.parse(req.body);
      const result = await FaceService.verifyFace({
        employeeId: validated.employeeId,
        probeEmbedding: validated.probeEmbedding,
        qualityScore: validated.qualityScore,
        faceCount: req.body.faceCount ?? 1,
        deviceId: validated.deviceId
      });

      return res.status(200).json({
        success: result.verified,
        message: result.message,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = (req.params.employeeId as string) || req.user?.employeeId;
      if (!employeeId) {
        return res.status(400).json({ success: false, message: 'Employee ID required', code: 'MISSING_EMP_ID' });
      }

      const status = await FaceService.getEnrollmentStatus(String(employeeId));
      return res.status(200).json({
        success: true,
        data: status
      });
    } catch (err) {
      next(err);
    }
  }

  static async disable(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = String(req.params.employeeId);
      const result = await FaceService.disableFace(employeeId, req.user?.id);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async identify(req: Request, res: Response, next: NextFunction) {
    try {
      const { probeEmbedding } = req.body;
      const companyId = req.body.companyId || req.user?.companyId;

      if (!probeEmbedding || !Array.isArray(probeEmbedding)) {
        return res.status(400).json({
          success: false,
          message: 'Probe face embedding vector is required',
          code: 'MISSING_PROBE'
        });
      }

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required',
          code: 'MISSING_COMPANY_ID'
        });
      }

      const result = await FaceService.identifyFace(companyId, probeEmbedding);
      return res.status(200).json({
        success: result.matched,
        message: result.message,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}
