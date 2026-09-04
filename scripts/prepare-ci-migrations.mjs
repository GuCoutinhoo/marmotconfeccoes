import fs from 'node:fs';
import path from 'node:path';

const sourceDir = path.resolve(process.cwd(), 'supabase/migrations');
const targetWorkdir = process.env.SUPABASE_WORKDIR || '/tmp/supabase-workspace';
const targetSupabaseDir = path.join(targetWorkdir, 'supabase');
const targetMigrationsDir = path.join(targetSupabaseDir, 'migrations');
const configSource = path.resolve(process.cwd(), 'supabase/config.toml');
const configTarget = path.join(targetSupabaseDir, 'config.toml');

console.log(`[CI MIGRATIONS] Source: ${sourceDir}`);
console.log(`[CI MIGRATIONS] Target Workspace: ${targetWorkdir}`);

// Ensure clean target directories
if (fs.existsSync(targetWorkdir)) {
  fs.rmSync(targetWorkdir, { recursive: true, force: true });
}
fs.mkdirSync(targetMigrationsDir, { recursive: true });

// Copy config.toml
if (fs.existsSync(configSource)) {
  fs.copyFileSync(configSource, configTarget);
  console.log(`[CI MIGRATIONS] Copied config.toml to ${configTarget}`);
} else {
  console.error(`[CI MIGRATIONS ERROR] supabase/config.toml not found at ${configSource}`);
  process.exit(1);
}

// Read all sql migration files
const files = fs.readdirSync(sourceDir).filter((f) => f.endsWith('.sql'));

// Canonical logical sequence
const canonicalOrder = [
  '20260301_001_core_schema.sql',
  '20260301_002_rls_and_security.sql',
  '20260301_003_atomic_rpcs.sql',
  '20260301_004_canonical_reconciliation.sql',
  '20260301_005_production_hardening.sql',
  '20260302_006_p0_p1_final_blockers_remediation.sql',
  '20260902_remove_profile_role_admin_authority.sql',
  '20260903_lock_profile_trigger_functions.sql',
  '20260903_cleanup_profile_rls_policies.sql',
  '20260904_protect_schema_migration_history.sql',
];

files.sort((a, b) => {
  const ia = canonicalOrder.indexOf(a);
  const ib = canonicalOrder.indexOf(b);
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return a.localeCompare(b);
});

const dateCounters = {};
const processed = [];

for (const file of files) {
  const matchWithSeq = file.match(/^(\d{8})_(\d{3})_(.*)$/);
  const matchPlain = file.match(/^(\d{8})_(.*)$/);
  let date;
  let seq;
  let rest;

  if (matchWithSeq) {
    date = matchWithSeq[1];
    seq = parseInt(matchWithSeq[2], 10);
    rest = matchWithSeq[3];
  } else if (matchPlain) {
    date = matchPlain[1];
    dateCounters[date] = (dateCounters[date] || 0) + 1;
    seq = dateCounters[date];
    rest = matchPlain[2];
  } else {
    date = '20260101';
    seq = (dateCounters[date] || 0) + 1;
    dateCounters[date] = seq;
    rest = file;
  }

  const seqStr = String(seq).padStart(4, '0') + '00';
  const uniqueName = `${date}${seqStr}_${rest}`;

  const srcPath = path.join(sourceDir, file);
  const dstPath = path.join(targetMigrationsDir, uniqueName);

  fs.copyFileSync(srcPath, dstPath);
  processed.push({ original: file, uniqueName });
  console.log(`[CI MIGRATIONS] ${file} -> ${uniqueName}`);
}

console.log(`[CI MIGRATIONS] Successfully prepared ${processed.length} migrations in ${targetMigrationsDir}`);
