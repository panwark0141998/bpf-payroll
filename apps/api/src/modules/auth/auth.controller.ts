import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { LoginSchema, MobileLoginSchema, RefreshTokenSchema } from '@bpf/validation';

export class AuthController {
  static async desktopLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = LoginSchema.parse(req.body);
      const result = await AuthService.desktopLogin({
        ...validated,
        ipAddress: req.ip || req.socket.remoteAddress
      });

      // Set HTTP-only cookie for refresh token
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async mobileLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = MobileLoginSchema.parse(req.body);
      const result = await AuthService.mobileLogin({
        ...validated,
        ipAddress: req.ip || req.socket.remoteAddress
      });

      return res.status(200).json({
        success: true,
        message: 'Mobile login successful',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      const validated = RefreshTokenSchema.parse({ refreshToken: token });
      const result = await AuthService.refreshToken(validated.refreshToken);

      return res.status(200).json({
        success: true,
        message: 'Token refreshed',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json({
        success: true,
        data: req.user
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie('refreshToken');
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (err) {
      next(err);
    }
  }
}
