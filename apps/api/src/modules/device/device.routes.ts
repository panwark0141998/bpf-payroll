import { Router } from 'express';
import { DeviceController } from './device.controller.js';
import { authenticateToken, requirePermission } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('device', 'view'), DeviceController.getDevices);
router.put('/:id/status', requirePermission('device', 'edit'), DeviceController.updateStatus);

export default router;
