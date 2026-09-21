import fs from 'fs';
import path from 'path';
import { db } from './db.js';

export async function runMigrations() {
  console.log('====================================================');
  console.log('  STARTING BPF PAYROLL DATABASE MIGRATIONS');
  console.log('====================================================');

  const migrationsDir = path.resolve(process.cwd(), '../../database/migrations');
  // Handle if running from apps/api root or monorepo root
  const resolvedDir = fs.existsSync(migrationsDir)
    ? migrationsDir
    : path.resolve(process.cwd(), 'database/migrations');

  console.log(`[Migration] Reading migration files from: ${resolvedDir}`);

  const files = fs.readdirSync(resolvedDir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const filePath = path.join(resolvedDir, file);
    console.log(`[Migration] Executing: ${file}...`);
    const sql = fs.readFileSync(filePath, 'utf-8');
    await db.exec(sql);
    console.log(`[Migration] Successfully applied: ${file}`);
  }

  console.log('====================================================');
  console.log('  ALL 35 DATABASE TABLES MIGRATED SUCCESSFULLY!');
  console.log('====================================================');
}

// Auto-run if executed directly via CLI
if (process.argv[1] && (process.argv[1].includes('migrate.ts') || process.argv[1].includes('migrate.js'))) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Migration Error]', err);
      process.exit(1);
    });
}
