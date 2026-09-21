import { Router } from 'express';
import { FaceController } from './face.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/enroll', FaceController.enroll);
router.post('/verify', FaceController.verify);
router.post('/identify', FaceController.identify);
router.get('/status/:employeeId', FaceController.getStatus);
router.post('/disable/:employeeId', FaceController.disable);

export default router;
