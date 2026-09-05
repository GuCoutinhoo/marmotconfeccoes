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

// 000. Inject Ephemeral Local Baseline Compatibility Migration
// Provides missing base tables and prerequisite columns for historical migrations
// to succeed on a blank Supabase Local instance.
const BASELINE_MIGRATION_FILENAME = '20260101000000_000_local_baseline_compatibility.sql';
const BASELINE_MIGRATION_SQL = `-- ==============================================================================
-- 000 LOCAL BASELINE COMPATIBILITY MIGRATION
-- Generated strictly for ephemeral local Supabase CI testing
-- Ensures all base tables, columns, and extensions expected by downstream
-- migrations and backend services exist with clean, idempotent DDL.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  image_url TEXT,
  banner_url TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PRODUCTS (base structure for initial foreign keys & alterations)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
  promo_price NUMERIC(10, 2) CHECK (promo_price IS NULL OR promo_price >= 0),
  category TEXT NOT NULL DEFAULT 'Geral',
  subcategory TEXT,
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  image TEXT,
  images TEXT[] DEFAULT '{}',
  stock_count INTEGER NOT NULL DEFAULT 0 CHECK (stock_count >= 0),
  is_new BOOLEAN DEFAULT FALSE,
  is_best_seller BOOLEAN DEFAULT FALSE,
  weight NUMERIC(6, 3) NOT NULL DEFAULT 0.350 CHECK (weight > 0),
  height NUMERIC(6, 2) NOT NULL DEFAULT 4.00 CHECK (height > 0),
  width NUMERIC(6, 2) NOT NULL DEFAULT 20.00 CHECK (width > 0),
  length NUMERIC(6, 2) NOT NULL DEFAULT 25.00 CHECK (length > 0),
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  sku TEXT,
  tags TEXT[] DEFAULT '{}',
  data JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PROFILES (ensure complete column set so REVOKE/GRANT and downstream DDL work)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  cpf TEXT,
  phone TEXT,
  avatar_url TEXT,
  addresses JSONB DEFAULT '[]'::jsonb,
  is_verified BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS addresses JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- 5. FAVORITES (referenced in 004 before 005)
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 6. STORE SETTINGS (referenced in 004 before 005)
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  key TEXT UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT
);

-- 7. AUDIT LOGS (referenced in 004 before 005)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_type TEXT NOT NULL,
  email TEXT,
  user_id TEXT,
  ip TEXT,
  status TEXT DEFAULT 'info',
  details TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SHIPPING QUOTES (referenced in 006)
CREATE TABLE IF NOT EXISTS public.shipping_quotes (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  destination_postal_code TEXT NOT NULL,
  service_id INTEGER NOT NULL,
  carrier TEXT NOT NULL,
  service_name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  delivery_time INTEGER NOT NULL DEFAULT 1,
  cart_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. STORE BANNERS
CREATE TABLE IF NOT EXISTS public.store_banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. CAMPAIGN RECORDS
CREATE TABLE IF NOT EXISTS public.campaign_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'discount',
  status TEXT DEFAULT 'active',
  discount_percentage NUMERIC(5, 2) DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  conditions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. COUPON REDEMPTIONS
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  coupon_id TEXT NOT NULL,
  coupon_code TEXT NOT NULL,
  order_id TEXT NOT NULL,
  user_id TEXT,
  customer_email TEXT NOT NULL,
  discount_amount NUMERIC(10, 2) NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. REFUND OPERATIONS
CREATE TABLE IF NOT EXISTS public.refund_operations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id TEXT NOT NULL,
  idempotency_key TEXT UNIQUE,
  amount NUMERIC(10, 2) NOT NULL,
  reason TEXT,
  admin_email TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  provider_refund_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. RETURNS & RETURN INVENTORY EFFECTS
CREATE TABLE IF NOT EXISTS public.returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'requested',
  reason TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.return_inventory_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID REFERENCES public.returns(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  condition TEXT,
  restocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order_value NUMERIC(10, 2) DEFAULT 0.00,
  max_discount_value NUMERIC(10, 2),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. NEWSLETTER SUBSCRIBERS
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  source TEXT DEFAULT 'footer',
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. EMAIL LOGS
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT,
  status TEXT NOT NULL,
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. ADMIN AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. SCHEMA MIGRATIONS
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version TEXT PRIMARY KEY,
  description TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const baselinePath = path.join(targetMigrationsDir, BASELINE_MIGRATION_FILENAME);
fs.writeFileSync(baselinePath, BASELINE_MIGRATION_SQL, 'utf8');
console.log(`[CI MIGRATIONS] Injected baseline compatibility migration: ${BASELINE_MIGRATION_FILENAME}`);

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

console.log(`[CI MIGRATIONS] Successfully prepared ${processed.length + 1} migrations (including baseline compatibility) in ${targetMigrationsDir}`);
