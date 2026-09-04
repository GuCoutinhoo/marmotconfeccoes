import fs from 'node:fs';
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const PROD_PROJECT_REF = 'ktmkvysnjfphcfntazut';

async function bootstrap() {
  // Load status from /tmp/supabase-status.env if exists
  if (fs.existsSync('/tmp/supabase-status.env')) {
    try {
      const lines = fs.readFileSync('/tmp/supabase-status.env', 'utf8').split('\n');
      for (const line of lines) {
        const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (match) {
          const key = match[1];
          const val = match[2].replace(/^["']|["']$/g, '');
          if (!process.env[key]) process.env[key] = val;
        }
      }
    } catch {}
  }

  let supabaseUrl = process.env.SUPABASE_DISPOSABLE_URL || process.env.API_URL || process.env.SUPABASE_URL;
  let anonKey = process.env.SUPABASE_DISPOSABLE_ANON_KEY || process.env.ANON_KEY || process.env.SUPABASE_ANON_KEY;
  let serviceRoleKey = process.env.SUPABASE_DISPOSABLE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  // If missing, attempt npx supabase status -o json
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    try {
      const workdirFlag = fs.existsSync('/tmp/supabase-workspace') ? ' --workdir /tmp/supabase-workspace' : '';
      const output = execSync(`npx supabase status -o json${workdirFlag}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const status = JSON.parse(output);
      supabaseUrl = supabaseUrl || status.API_URL || status.api_url;
      anonKey = anonKey || status.ANON_KEY || status.anon_key;
      serviceRoleKey = serviceRoleKey || status.SERVICE_ROLE_KEY || status.service_role_key;
    } catch {}
  }

  if (!supabaseUrl) {
    supabaseUrl = 'http://127.0.0.1:54321';
  }

  // Safety Gate: Explicit rejection of production instance
  if (supabaseUrl.includes(PROD_PROJECT_REF)) {
    console.error(`[CRITICAL SECURITY REJECTION] REFUSING_TO_RUN_DESTRUCTIVE_TESTS_AGAINST_PRODUCTION: Target URL points to production Supabase instance (${PROD_PROJECT_REF})!`);
    process.exit(1);
  }

  if (!serviceRoleKey || !anonKey) {
    console.error('[BOOTSTRAP ERROR] Real Supabase local credentials not found. Supabase local must be running.');
    process.exit(1);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const nonce = crypto.randomBytes(4).toString('hex');
  const timestamp = Date.now();

  const customerEmail = `ephemeral-customer-${timestamp}-${nonce}@marmot-disposable.test`;
  const customerPassword = `Cust!${crypto.randomBytes(12).toString('base64url')}9#`;

  const adminEmail = `ephemeral-admin-${timestamp}-${nonce}@marmot-disposable.test`;
  const adminPassword = `Admin!${crypto.randomBytes(12).toString('base64url')}9#`;

  const attackerEmail = `ephemeral-attacker-${timestamp}-${nonce}@marmot-disposable.test`;
  const attackerPassword = `Atk!${crypto.randomBytes(12).toString('base64url')}9#`;

  // 1. Create ephemeral Customer
  const { data: custData, error: custErr } = await adminClient.auth.admin.createUser({
    email: customerEmail,
    password: customerPassword,
    email_confirm: true,
    user_metadata: { name: 'Cliente E2E Teste', full_name: 'Cliente E2E Teste' },
  });
  if (custErr) {
    console.error('[BOOTSTRAP ERROR] Failed to create ephemeral customer:', custErr.message);
    process.exit(1);
  }
  console.log('Customer created: yes');

  // 2. Create ephemeral Admin (strictly app_metadata.role = 'admin')
  const { data: admData, error: admErr } = await adminClient.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { name: 'Administrador E2E Teste', full_name: 'Administrador E2E Teste' },
    app_metadata: { role: 'admin' },
  });
  if (admErr) {
    console.error('[BOOTSTRAP ERROR] Failed to create ephemeral admin:', admErr.message);
    process.exit(1);
  }
  console.log('Admin created: yes');

  // 3. Create ephemeral Attacker (strictly unprivileged)
  const { data: atkData, error: atkErr } = await adminClient.auth.admin.createUser({
    email: attackerEmail,
    password: attackerPassword,
    email_confirm: true,
    user_metadata: { name: 'Attacker E2E Teste', full_name: 'Attacker E2E Teste' },
  });
  if (atkErr) {
    console.error('[BOOTSTRAP ERROR] Failed to create ephemeral attacker:', atkErr.message);
    process.exit(1);
  }
  console.log('Attacker created: yes');

  // Authenticate all identities with real GoTrue signInWithPassword
  const publicClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: custLogin, error: custLoginErr } = await publicClient.auth.signInWithPassword({
    email: customerEmail,
    password: customerPassword,
  });
  if (custLoginErr || !custLogin?.session?.access_token) {
    console.error('[BOOTSTRAP ERROR] Real GoTrue customer authentication failed:', custLoginErr?.message);
    process.exit(1);
  }
  const customerToken = custLogin.session.access_token;

  const { data: admLogin, error: admLoginErr } = await publicClient.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (admLoginErr || !admLogin?.session?.access_token) {
    console.error('[BOOTSTRAP ERROR] Real GoTrue admin authentication failed:', admLoginErr?.message);
    process.exit(1);
  }
  const adminToken = admLogin.session.access_token;

  const { data: atkLogin, error: atkLoginErr } = await publicClient.auth.signInWithPassword({
    email: attackerEmail,
    password: attackerPassword,
  });
  if (atkLoginErr || !atkLogin?.session?.access_token) {
    console.error('[BOOTSTRAP ERROR] Real GoTrue attacker authentication failed:', atkLoginErr?.message);
    process.exit(1);
  }
  const attackerToken = atkLogin.session.access_token;

  // Export environment variables
  const envExports = {
    SUPABASE_DISPOSABLE_URL: supabaseUrl,
    SUPABASE_DISPOSABLE_ANON_KEY: anonKey,
    SUPABASE_DISPOSABLE_SERVICE_ROLE_KEY: serviceRoleKey,
    SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: anonKey,
    VITE_SUPABASE_ANON_KEY: anonKey,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    TEST_CUSTOMER_EMAIL: customerEmail,
    TEST_CUSTOMER_PASSWORD: customerPassword,
    TEST_CUSTOMER_TOKEN: customerToken,
    TEST_CUSTOMER_ID: custData.user.id,
    TEST_ADMIN_EMAIL: adminEmail,
    TEST_ADMIN_PASSWORD: adminPassword,
    TEST_ADMIN_TOKEN: adminToken,
    TEST_ADMIN_ID: admData.user.id,
    TEST_ATTACKER_EMAIL: attackerEmail,
    TEST_ATTACKER_PASSWORD: attackerPassword,
    TEST_ATTACKER_TOKEN: attackerToken,
    TEST_ATTACKER_ID: atkData.user.id,
  };

  const envLines = Object.entries(envExports)
    .map(([k, v]) => `export ${k}="${v}"`)
    .join('\n');
  fs.writeFileSync('/tmp/supabase-disposable.env', envLines + '\n', { mode: 0o600 });

  if (process.env.GITHUB_ENV) {
    const ghEnvLines = Object.entries(envExports)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
    fs.appendFileSync(process.env.GITHUB_ENV, ghEnvLines + '\n');
  }
}

bootstrap().catch((err) => {
  console.error('[BOOTSTRAP FATAL ERROR]:', err?.message || err);
  process.exit(1);
});
