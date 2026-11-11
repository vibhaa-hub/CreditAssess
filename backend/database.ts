import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

export function createDatabasePool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL must be configured before starting the application.');
  }
  if (process.env.NODE_ENV === 'production' && !connectionString.includes('sslmode=verify-full')) {
    throw new Error('Production DATABASE_URL must use sslmode=verify-full.');
  }

  return new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    application_name: 'apexcredit',
  });
}

export async function assertDatabaseSchema(pool: Pool): Promise<void> {
  const result = await pool.query<{ version: number }>(
    'SELECT version FROM schema_migrations WHERE version = 1'
  );
  if (result.rowCount !== 1) {
    throw new Error('Database schema is not installed. Run `npm run db:migrate` before starting the app.');
  }
}

export async function applyInitialSchema(pool: Pool): Promise<void> {
  const schemaPath = path.resolve(currentDirectory, '..', 'database', 'schema.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         version integer PRIMARY KEY,
         applied_at timestamptz NOT NULL DEFAULT now()
       )`
    );
    const installed = await client.query(
      'SELECT 1 FROM schema_migrations WHERE version = 1'
    );
    if (installed.rowCount === 1) {
      await client.query('COMMIT');
      return;
    }
    await client.query(schema);
    await client.query(
      'INSERT INTO schema_migrations (version) VALUES (1) ON CONFLICT (version) DO NOTHING'
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
