/**
 * Run this script to execute migration-v4.sql against the remote Supabase project.
 *
 * Prerequisites:
 *   1. Get your DATABASE_URL from Supabase Dashboard → Project Settings → Database → Connection string
 *   2. Set it:  $env:DATABASE_URL = "postgresql://postgres:..."
 *
 * Usage:
 *   node scripts/run-migration.mjs
 *
 * Alternative (no script):
 *   Paste the contents of supabase/migration-v4.sql into:
 *   https://supabase.com/dashboard/project/ixncaswdwpxfazhzagqu/sql/new
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, '..', 'supabase', 'migration-v4.sql'), 'utf-8');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set.');
  console.error('Get it from: https://supabase.com/dashboard/project/ixncaswdwpxfazhzagqu/settings/database');
  console.error('Then:  $env:DATABASE_URL = "postgresql://postgres:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"');
  console.error('');
  console.error('Or paste supabase/migration-v4.sql directly into the SQL Editor:');
  console.error('https://supabase.com/dashboard/project/ixncaswdwpxfazhzagqu/sql/new');
  process.exit(1);
}

// Use dynamic import for the pg module
try {
  const pg = await import('pg');
  const { Pool } = pg.default || pg;
  const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

  console.error('Running migration-v4.sql...');
  const result = await pool.query(sql);
  console.error('Migration applied successfully.');

  // Verify
  const { rows: roles } = await pool.query("SELECT id, username, role FROM profiles ORDER BY created_at ASC");
  console.log('\nProfiles after migration:');
  for (const r of roles) {
    console.log(`  ${r.username || '(no name)'}  →  ${r.role}`);
  }

  await pool.end();
} catch (err) {
  console.error('Failed. Install pg:  npm install pg --save-dev');
  console.error('');
  console.error('Or paste the SQL into the SQL Editor:');
  console.error('https://supabase.com/dashboard/project/ixncaswdwpxfazhzagqu/sql/new');
  console.error('');
  console.error(err.message);
  process.exit(1);
}
