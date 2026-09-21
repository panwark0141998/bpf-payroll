import { Request, Response, NextFunction } from 'express';
import { DeviceService } from './device.service.js';

export class DeviceController {
  static async getDevices(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user?.companyId;
      const status = req.query.status as string;
      const devices = await DeviceService.getDevices(companyId!, status);
      return res.status(200).json({ success: true, data: devices });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      if (!['APPROVED', 'DISABLED', 'BLOCKED'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid device status', code: 'INVALID_STATUS' });
      }

      const updated = await DeviceService.updateDeviceStatus(String(req.params.id), status, req.user?.id);
      return res.status(200).json({ success: true, message: 'Device status updated', data: updated });
    } catch (err) {
      next(err);
    }
  }
}
