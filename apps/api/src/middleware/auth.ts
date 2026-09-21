import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { db } from '../database/db.js';
import { supabase } from '../utils/supabase/client.js';

export interface AuthUser {
  id: string;
  companyId: string;
  unitId?: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: Record<string, string[]>;
  employeeId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token missing',
      code: 'AUTH_TOKEN_MISSING'
    });
  }

  try {
    let targetUserId = '';
    try {
      const payload = jwt.verify(token, config.jwtSecret) as any;
      targetUserId = payload.userId;
    } catch (jwtErr) {
      if (config.supabasePublishableKey || config.supabaseSecretKey) {
        const { data } = await supabase.auth.getUser(token);
        if (data?.user?.email) {
          const supUserRes = await db.query(
            `SELECT id FROM users WHERE LOWER(email) = LOWER($1);`,
            [data.user.email]
          );
          if (supUserRes.rows.length > 0) {
            targetUserId = supUserRes.rows[0].id;
          }
        }
      }
      if (!targetUserId) {
        throw jwtErr;
      }
    }

    // Load fresh user data and permissions
    const userRes = await db.query(
      `SELECT u.id, u.company_id, u.unit_id, u.username, u.email, u.full_name, u.status, u.employee_id
       FROM users u
       WHERE u.id = $1;`,
      [targetUserId]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userRes.rows[0];
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive or locked',
        code: 'USER_INACTIVE'
      });
    }

    // Load roles
    const rolesRes = await db.query(
      `SELECT r.name
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1;`,
      [user.id]
    );
    const roles = rolesRes.rows.map((r: any) => r.name);

    // Load permissions
    const permsRes = await db.query(
      `SELECT DISTINCT p.module, p.action
       FROM user_roles ur
       JOIN role_permissions rp ON ur.role_id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE ur.user_id = $1;`,
      [user.id]
    );

    const permissions: Record<string, string[]> = {};
    permsRes.rows.forEach((p: any) => {
      if (!permissions[p.module]) {
        permissions[p.module] = [];
      }
      permissions[p.module].push(p.action);
    });

    req.user = {
      id: user.id,
      companyId: user.company_id,
      unitId: user.unit_id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      roles,
      permissions,
      employeeId: user.employee_id
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token',
      code: 'TOKEN_INVALID'
    });
  }
}

export function requirePermission(module: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access',
        code: 'UNAUTHORIZED'
      });
    }

    // SUPER_ADMIN has god-mode bypass
    if (req.user.roles.includes('SUPER_ADMIN')) {
      return next();
    }

    const modulePerms = req.user.permissions[module] || [];
    if (!modulePerms.includes(action)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You do not have '${action}' permission on '${module}'`,
        code: 'PERMISSION_DENIED',
        requiredPermission: `${module}:${action}`
      });
    }

    next();
  };
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access',
        code: 'UNAUTHORIZED'
      });
    }

    if (req.user.roles.includes('SUPER_ADMIN')) {
      return next();
    }

    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient role permissions',
        code: 'ROLE_DENIED',
        allowedRoles
      });
    }

    next();
  };
}
