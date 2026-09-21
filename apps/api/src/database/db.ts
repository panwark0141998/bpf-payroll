import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';

const { Pool } = pg;

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface DbClient {
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
  exec(sql: string): Promise<any>;
  transaction<T = any>(callback: (tx: { query<R = any>(sql: string, params?: any[]): Promise<QueryResult<R>> }) => Promise<T>): Promise<T>;
}

let pgliteInstance: PGlite | null = null;
let pgPool: pg.Pool | null = null;

export async function getDbClient() {
  if (config.databaseUrl) {
    if (!pgPool) {
      const isRemote = config.databaseUrl.includes('supabase') ||
                       config.databaseUrl.includes('pooler') ||
                       config.databaseUrl.includes('aws') ||
                       config.databaseUrl.includes('sslmode=require') ||
                       process.env.NODE_ENV === 'production';
      pgPool = new Pool({
        connectionString: config.databaseUrl,
        ssl: isRemote ? { rejectUnauthorized: false } : undefined,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
      });
      console.log(`[Database] Connected to external PostgreSQL cluster via pg.Pool (SSL: ${isRemote ? 'enabled' : 'disabled'}).`);
    }
    return {
      type: 'postgres_pool' as const,
      pool: pgPool
    };
  } else {
    if (!pgliteInstance) {
      const dataDir = config.pgDataDir;
      const parentDir = path.dirname(dataDir);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      pgliteInstance = new PGlite(dataDir);
      await pgliteInstance.waitReady;
      console.log(`[Database] Initialized Embedded PostgreSQL 16 engine at: ${dataDir}`);
    }
    return {
      type: 'pglite' as const,
      instance: pgliteInstance
    };
  }
}

export const db: DbClient = {
  async query<T = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
    const client = await getDbClient();
    try {
      if (client.type === 'postgres_pool') {
        const res = await client.pool.query(text, params);
        return {
          rows: (res.rows || []) as T[],
          rowCount: res.rowCount || 0
        };
      } else {
        const res = await client.instance.query(text, params);
        return {
          rows: (res.rows || []) as T[],
          rowCount: res.rows ? res.rows.length : ((res as any).affectedRows || 0)
        };
      }
    } catch (err: any) {
      console.error(`[Database Query Error] ${err.message}\nSQL: ${text}\nParams:`, params);
      throw err;
    }
  },

  async exec(sql: string): Promise<any> {
    const client = await getDbClient();
    try {
      if (client.type === 'postgres_pool') {
        return await client.pool.query(sql);
      } else {
        return await client.instance.exec(sql);
      }
    } catch (err: any) {
      console.error(`[Database Exec Error] ${err.message}\nSQL snippet: ${sql.slice(0, 300)}...`);
      throw err;
    }
  },

  async transaction<T = any>(callback: (tx: { query<R = any>(sql: string, params?: any[]): Promise<QueryResult<R>> }) => Promise<T>): Promise<T> {
    const client = await getDbClient();
    if (client.type === 'postgres_pool') {
      const poolClient = await client.pool.connect();
      try {
        await poolClient.query('BEGIN');
        const txWrapper = {
          query: async <R = any>(sql: string, params: any[] = []): Promise<QueryResult<R>> => {
            const res = await poolClient.query(sql, params);
            return { rows: (res.rows || []) as R[], rowCount: res.rowCount || 0 };
          }
        };
        const result = await callback(txWrapper);
        await poolClient.query('COMMIT');
        return result;
      } catch (err) {
        await poolClient.query('ROLLBACK');
        throw err;
      } finally {
        poolClient.release();
      }
    } else {
      try {
        await client.instance.query('BEGIN');
        const txWrapper = {
          query: async <R = any>(sql: string, params: any[] = []): Promise<QueryResult<R>> => {
            const res = await client.instance.query(sql, params);
            return {
              rows: (res.rows || []) as R[],
              rowCount: res.rows ? res.rows.length : ((res as any).affectedRows || 0)
            };
          }
        };
        const result = await callback(txWrapper);
        await client.instance.query('COMMIT');
        return result;
      } catch (err) {
        await client.instance.query('ROLLBACK');
        throw err;
      }
    }
  }
};
