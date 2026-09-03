import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Client } = pg;

async function setup() {
  const dbUrl = process.env.DISPOSABLE_DATABASE_URL;
  if (!dbUrl) {
    console.log('[Setup Test DB] No DISPOSABLE_DATABASE_URL provided. Skipping local DB bootstrap.');
    return;
  }

  console.log('[Setup Test DB] Bootstrapping isolated test database from migration...');
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    const migrationFile = path.join(process.cwd(), 'supabase-complete-production-migration.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    await client.query(sql);
    console.log('[Setup Test DB] Successfully applied production migration to disposable database!');
  } catch (err) {
    console.error('[Setup Test DB Error]:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setup();
