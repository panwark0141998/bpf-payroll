import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

router.post('/login', AuthController.desktopLogin);
router.post('/mobile-login', AuthController.mobileLogin);
router.post('/refresh', AuthController.refresh);
router.get('/me', authenticateToken, AuthController.getMe);
router.post('/logout', authenticateToken, AuthController.logout);

export default router;
