import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const targetDist = path.join(rootDir, 'dist');
const desktopDist = path.join(rootDir, 'apps', 'desktop', 'dist');
const mobileDist = path.join(rootDir, 'apps', 'mobile', 'dist');

// Clean and recreate root dist
if (fs.existsSync(targetDist)) {
  fs.rmSync(targetDist, { recursive: true, force: true });
}
fs.mkdirSync(targetDist, { recursive: true });

// 1. Copy Desktop HR & Payroll Web to root of dist/
if (fs.existsSync(desktopDist)) {
  fs.cpSync(desktopDist, targetDist, { recursive: true });
  console.log('[Deploy] Copied Desktop HR & Payroll portal to dist/');
} else {
  console.warn('[Deploy] Warning: apps/desktop/dist not found.');
}

// 2. Copy Mobile Face Attendance to dist/mobile/
const mobileTarget = path.join(targetDist, 'mobile');
if (fs.existsSync(mobileDist)) {
  fs.cpSync(mobileDist, mobileTarget, { recursive: true });
  console.log('[Deploy] Copied Mobile Face Attendance app to dist/mobile/');
} else {
  console.warn('[Deploy] Warning: apps/mobile/dist not found.');
}

console.log('====================================================');
console.log('  BPF PAYROLL MONOREPO UNIFIED BUNDLE READY IN dist/');
console.log('  - Desktop HR & Payroll: /');
console.log('  - Mobile Face Attendance: /mobile');
console.log('====================================================');
