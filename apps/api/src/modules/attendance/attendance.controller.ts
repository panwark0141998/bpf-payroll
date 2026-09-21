import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from './attendance.service.js';
import { AttendancePunchSchema, AttendanceSyncBatchSchema } from '@bpf/validation';

export class AttendanceController {
  static async punchIn(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = req.body.employeeId || req.user?.employeeId;
      if (!employeeId) {
        return res.status(400).json({ success: false, message: 'Employee ID required', code: 'MISSING_EMP_ID' });
      }

      const validated = AttendancePunchSchema.parse({
        ...req.body,
        employeeId
      });

      const result = await AttendanceService.punchIn(validated);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async punchOut(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = req.body.employeeId || req.user?.employeeId;
      if (!employeeId) {
        return res.status(400).json({ success: false, message: 'Employee ID required', code: 'MISSING_EMP_ID' });
      }

      const validated = AttendancePunchSchema.parse({
        ...req.body,
        employeeId
      });

      const result = await AttendanceService.punchOut(validated);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async sync(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = AttendanceSyncBatchSchema.parse(req.body);
      const result = await AttendanceService.syncOfflinePunches(validated.punches as any);
      return res.status(200).json({
        success: true,
        message: `Sync completed. ${result.processedCount} processed, ${result.duplicateCount} duplicates skipped, ${result.failedCount} failed.`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMyHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = (req.query.employeeId as string) || req.user?.employeeId;
      if (!employeeId) {
        return res.status(400).json({ success: false, message: 'Employee ID required', code: 'MISSING_EMP_ID' });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
      const history = await AttendanceService.getMyHistory(employeeId, limit);
      return res.status(200).json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  }

  static async getTodayRegister(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user?.companyId;
      const unitId = req.query.unitId as string;
      const register = await AttendanceService.getTodayRegister(companyId!, unitId);
      return res.status(200).json({ success: true, data: register });
    } catch (err) {
      next(err);
    }
  }
}
