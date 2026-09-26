import { app } from '../apps/api/dist/index.js';

/**
 * Vercel Serverless Function entrypoint for BPF Payroll REST API.
 */
export default function handler(req, res) {
  // In Vercel serverless environment, ensure req.url matches the mounted Express routes
  const originalUrl = req.headers['x-forwarded-url'] || req.headers['x-matched-path'] || req.url;
  if (originalUrl && originalUrl.startsWith('/api')) {
    req.url = originalUrl;
  } else if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
}

