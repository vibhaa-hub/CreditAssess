import 'dotenv/config';
import { applyInitialSchema, createDatabasePool } from './database';

async function main(): Promise<void> {
  const pool = createDatabasePool();
  try {
    await applyInitialSchema(pool);
    console.log('Database schema version 1 is installed.');
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error('Database migration failed:', error);
  process.exitCode = 1;
});
