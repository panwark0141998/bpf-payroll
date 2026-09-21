import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { config } from './config/index.js';
import { getDbClient, db } from './database/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticateToken } from './middleware/auth.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import companyRoutes from './modules/company/company.routes.js';
import employeeRoutes from './modules/employee/employee.routes.js';
import faceRoutes from './modules/face/face.routes.js';
import deviceRoutes from './modules/device/device.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import { DashboardService } from './modules/reports/dashboard.service.js';
import { AuditService } from './modules/audit/audit.service.js';

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false
}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('vercel.app') ||
      origin === config.clientUrl ||
      origin === config.mobileUrl
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use('/api', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(config.cookieSecret));

// Static files for uploads / avatars / slips
app.use('/uploads', express.static(config.storageDir));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ONLINE',
    system: 'BPF Payroll & Mobile Face Attendance API',
    version: '1.0.0',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// Mount Module Routes
app.use('/api/auth', authRoutes);
app.use('/api', companyRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/face', faceRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/attendance', attendanceRoutes);

// Dashboard Metrics
app.get('/api/dashboard/metrics', authenticateToken, async (req, res, next) => {
  try {
    const companyId = req.user?.companyId;
    const unitId = req.query.unitId as string;
    const metrics = await DashboardService.getMetrics(companyId!, unitId);
    res.status(200).json({ success: true, data: metrics });
  } catch (err) {
    next(err);
  }
});

// Audit Logs
app.get('/api/audit/logs', authenticateToken, async (req, res, next) => {
  try {
    const { module, action, limit, offset } = req.query;
    const logs = await AuditService.getLogs({
      module: module as string,
      action: action as string,
      limit: limit ? parseInt(limit as string, 10) : 50,
      offset: offset ? parseInt(offset as string, 10) : 0
    });
    res.status(200).json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

// Serve compiled Desktop and Mobile web apps
const distPath = path.resolve(process.cwd(), 'dist');
const altDistPath = path.resolve(process.cwd(), '../../dist');
const resolvedDist = fs.existsSync(distPath) ? distPath : (fs.existsSync(altDistPath) ? altDistPath : null);

if (resolvedDist) {
  const mobileDistPath = path.join(resolvedDist, 'mobile');
  if (fs.existsSync(mobileDistPath)) {
    app.use('/mobile', express.static(mobileDistPath));
    app.get(['/mobile', '/mobile/*'], (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(mobileDistPath, 'index.html'));
    });
  }

  app.use(express.static(resolvedDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(resolvedDist, 'index.html'));
  });
}

// Global Error Handler
app.use(errorHandler);

// Server startup
async function startServer() {
  try {
    console.log('====================================================');
    console.log('  STARTING BPF PAYROLL CENTRAL API SERVER');
    console.log('====================================================');

    await getDbClient();
    console.log('[Database] Database connection verified.');

    const server = app.listen(config.port, () => {
      console.log(`[API Server] Running on http://localhost:${config.port}`);
      console.log(`[API Server] Desktop Client: ${config.clientUrl}`);
      console.log(`[API Server] Mobile Client:  ${config.mobileUrl}`);
      console.log('====================================================');
    });

    return server;
  } catch (err) {
    console.error('[Fatal Startup Error]', err);
    process.exit(1);
  }
}

if (process.argv[1] && (process.argv[1].includes('index.ts') || process.argv[1].includes('index.js'))) {
  startServer();
}

export { app, startServer };
