import { app } from '../apps/api/dist/index.js';

/**
 * Vercel Serverless Function entrypoint for BPF Payroll REST API.
 */
export default function handler(req, res) {
  return app(req, res);
}
