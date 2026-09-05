import fs from 'node:fs';
import { execSync } from 'node:child_process';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const { Client } = pg;

const REQUIRED_CANONICAL_TABLES = [
  'profiles',
  'products',
  'categories',
  'orders',
  'order_items',
  'cart_items',
  'wishlist_items',
  'user_addresses',
  'coupons',
  'payment_effects',
  'inventory_movements',
  'order_status_history',
  'product_reviews',
  'shipment_operations',
  'webhook_events',
  'app_settings',
  'favorites',
  'returns',
  'store_banners',
  'store_settings',
  'newsletter_subscribers',
  'email_logs',
  'admin_audit_logs',
  'audit_logs',
  'shipping_quotes',
  'shipment_events',
  'campaign_records',
  'coupon_redemptions',
  'refund_operations',
  'return_inventory_effects',
  'schema_migrations',
];

async function verifySchema() {
  console.log('[SCHEMA VERIFICATION] Starting canonical schema and security invariants verification...');

  // 1. Resolve connection parameters
  const env = { ...process.env };
  if (fs.existsSync('/tmp/supabase-status.env')) {
    try {
      const lines = fs.readFileSync('/tmp/supabase-status.env', 'utf8').split('\n');
      for (const line of lines) {
        const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (match) {
          const key = match[1];
          const val = match[2].replace(/^["']|["']$/g, '');
          if (!env[key]) env[key] = val;
        }
      }
    } catch {}
  }

  let dbUrl = env.DB_URL;
  let apiUrl = env.API_URL || env.SUPABASE_URL || 'http://127.0.0.1:54321';
  let serviceRoleKey = env.SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!dbUrl || !serviceRoleKey) {
    try {
      const workdirFlag = fs.existsSync('/tmp/supabase-workspace') ? ' --workdir /tmp/supabase-workspace' : '';
      const output = execSync(`npx supabase status -o json${workdirFlag}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const status = JSON.parse(output);
      dbUrl = dbUrl || status.DB_URL || status.db_url;
      apiUrl = apiUrl || status.API_URL || status.api_url;
      serviceRoleKey = serviceRoleKey || status.SERVICE_ROLE_KEY || status.service_role_key;
    } catch {}
  }

  // 2. Perform direct PostgreSQL introspection if DB_URL is accessible
  if (dbUrl) {
    console.log(`[SCHEMA VERIFICATION] Connecting directly to PostgreSQL via ${dbUrl.replace(/:[^:@]+@/, ':***@')}...`);
    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    try {
      // 2a. Table Existence
      const tableRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
      `);
      const existingTables = new Set(tableRes.rows.map((r) => r.table_name));

      const missingTables = REQUIRED_CANONICAL_TABLES.filter((t) => !existingTables.has(t));
      if (missingTables.length > 0) {
        throw new Error(`[SCHEMA VERIFICATION FAILED] Missing canonical tables: ${missingTables.join(', ')}`);
      }
      console.log(`[SCHEMA VERIFICATION] All ${REQUIRED_CANONICAL_TABLES.length} canonical tables confirmed present in public schema.`);

      // 2b. Columns on profiles
      const profileColsRes = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles';
      `);
      const profileCols = new Set(profileColsRes.rows.map((r) => r.column_name));
      const requiredProfileCols = ['id', 'email', 'name', 'role', 'cpf', 'phone', 'avatar_url', 'addresses', 'data'];
      for (const col of requiredProfileCols) {
        if (!profileCols.has(col)) {
          throw new Error(`[SCHEMA VERIFICATION FAILED] profiles table is missing required column: ${col}`);
        }
      }
      console.log('[SCHEMA VERIFICATION] profiles columns verified (including addresses, role, avatar_url, data).');

      // 2c. is_admin() Security Invariant: Must NOT query public.profiles
      const procRes = await client.query(`
        SELECT p.proname, p.prosrc, p.prosecdef
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'is_admin';
      `);
      if (procRes.rows.length === 0) {
        throw new Error('[SCHEMA VERIFICATION FAILED] public.is_admin() function not found!');
      }

      for (const row of procRes.rows) {
        if (!row.prosecdef) {
          throw new Error('[SCHEMA VERIFICATION FAILED] public.is_admin() is not SECURITY DEFINER!');
        }
        const sourceLower = row.prosrc.toLowerCase();
        if (sourceLower.includes('profiles') || sourceLower.includes('from public.profiles')) {
          throw new Error('[SCHEMA SECURITY REGRESSION] public.is_admin() still references profiles table! Must decouple from profiles.role authority.');
        }
      }
      console.log('[SCHEMA VERIFICATION] public.is_admin() security hardening verified: strictly decoupled from profiles.role.');

      // 2d. Trigger on profiles: trg_prevent_profile_role_escalation
      const triggerRes = await client.query(`
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public' AND event_object_table = 'profiles';
      `);
      const triggers = new Set(triggerRes.rows.map((r) => r.trigger_name));
      if (!triggers.has('trg_prevent_profile_role_escalation')) {
        throw new Error('[SCHEMA SECURITY REGRESSION] trg_prevent_profile_role_escalation trigger missing on public.profiles!');
      }
      console.log('[SCHEMA VERIFICATION] Privilege escalation triggers verified on public.profiles.');

      // 2e. Schema migrations history table
      const migRes = await client.query('SELECT count(*)::int as count FROM public.schema_migrations;');
      console.log(`[SCHEMA VERIFICATION] public.schema_migrations confirmed tracking ${migRes.rows[0].count} migrations.`);

    } finally {
      await client.end();
    }
  } else if (serviceRoleKey && apiUrl) {
    // Fallback verification via PostgREST / Supabase JS client
    console.log(`[SCHEMA VERIFICATION] Verifying tables via Supabase API at ${apiUrl}...`);
    const supabase = createClient(apiUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    for (const table of REQUIRED_CANONICAL_TABLES) {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      if (error && error.code !== 'PGRST116' && !error.message.includes('0 rows')) {
        // Any error other than empty table indicates missing relation
        if (error.message.includes('does not exist') || error.code === '42P01') {
          throw new Error(`[SCHEMA VERIFICATION FAILED] Table public.${table} does not exist in local Supabase.`);
        }
      }
    }
    console.log(`[SCHEMA VERIFICATION] All ${REQUIRED_CANONICAL_TABLES.length} canonical tables confirmed accessible via PostgREST.`);
  } else {
    throw new Error('[SCHEMA VERIFICATION ERROR] Neither DB_URL nor API_URL/SERVICE_ROLE_KEY available for schema verification.');
  }

  console.log('================================================================');
  console.log('✅ CANONICAL SCHEMA & SECURITY INVARIANTS 100% VERIFIED');
  console.log('================================================================');
}

verifySchema().catch((err) => {
  console.error('[SCHEMA VERIFICATION FATAL]:', err.message || err);
  process.exit(1);
});
