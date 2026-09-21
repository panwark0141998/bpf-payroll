import { Router } from 'express';
import { AttendanceController } from './attendance.controller.js';
import { authenticateToken, requirePermission } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/in', AttendanceController.punchIn);
router.post('/out', AttendanceController.punchOut);
router.post('/sync', AttendanceController.sync);
router.get('/my-history', AttendanceController.getMyHistory);
router.get('/today', requirePermission('attendance', 'view'), AttendanceController.getTodayRegister);

export default router;
