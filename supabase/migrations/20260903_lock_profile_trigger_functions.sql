-- Migration: 20260903_lock_profile_trigger_functions
-- Purpose:
-- 1. Revoke public/anon/authenticated execution on internal trigger functions
--    (enforce_profile_insert_role and prevent_profile_role_escalation)
--    so they cannot be called as public RPCs while still executing via table triggers.
-- 2. Drop redundant legacy trigger trg_protect_profile_role and protect_profile_role()
--    to ensure trg_prevent_profile_role_escalation is the single authoritative UPDATE role guard.
-- 3. Eliminate proven duplicate indexes (idx_favorites_user, idx_orders_email).
-- 4. Clean legacy permissive policies on public.profiles to prevent multiple permissive evaluation.
-- 5. Track migrations in public.schema_migrations idempotently.

-- =========================================================================
-- 1. REVOKE PUBLIC RPC ACCESS ON TRIGGER FUNCTIONS
-- =========================================================================
-- Trigger functions are invoked by the PostgreSQL engine on table operations,
-- and must NOT be accessible as public Remote Procedure Calls (RPC).
REVOKE ALL ON FUNCTION public.enforce_profile_insert_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_profile_role_escalation() FROM PUBLIC, anon, authenticated;

-- Ensure service_role retains execute if invoked administratively
GRANT EXECUTE ON FUNCTION public.enforce_profile_insert_role() TO service_role;
GRANT EXECUTE ON FUNCTION public.prevent_profile_role_escalation() TO service_role;

-- =========================================================================
-- 2. REMOVE REDUNDANT LEGACY TRIGGER & FUNCTION
-- =========================================================================
-- trg_prevent_profile_role_escalation is the authoritative trigger for profiles.role UPDATE.
-- trg_protect_profile_role was an older implementation that queried is_admin().
DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
DROP FUNCTION IF EXISTS public.protect_profile_role();

-- =========================================================================
-- 3. REMOVE PROVEN DUPLICATE INDEXES (PERFORMANCE ADVISOR)
-- =========================================================================
-- Favorites: idx_favorites_user vs idx_favorites_user_id (both on user_id)
DROP INDEX IF EXISTS public.idx_favorites_user;

-- Orders: idx_orders_email vs idx_orders_customer_email (both on customer_email)
DROP INDEX IF EXISTS public.idx_orders_email;

-- =========================================================================
-- 4. CLEAN REDUNDANT / MULTIPLE PERMISSIVE POLICIES ON PROFILES
-- =========================================================================
DROP POLICY IF EXISTS "Profiles read restricted to owner and admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update restricted to owner and admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert restricted to owner and admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles delete restricted to owner and admin" ON public.profiles;

-- Ensure the canonical policies use (select auth.uid()) for InitPlan optimization
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR ((select auth.uid()) IS NOT NULL AND ((select auth.uid()))::text = id::text)
  );

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR ((select auth.uid()) IS NOT NULL AND ((select auth.uid()))::text = id::text)
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR ((select auth.uid()) IS NOT NULL AND ((select auth.uid()))::text = id::text)
  );

-- =========================================================================
-- 5. TRACK SCHEMA MIGRATIONS IDEMPOTENTLY
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT
);

INSERT INTO public.schema_migrations (version, description)
VALUES 
  ('20260902_remove_profile_role_admin_authority', 'Decouple profiles.role from admin authorization, revoke UPDATE role from authenticated, lock is_admin RPC to service_role'),
  ('20260903_lock_profile_trigger_functions', 'Revoke execute on trigger functions from anon/authenticated, remove legacy trigger, clean duplicate indexes, and optimize InitPlan RLS')
ON CONFLICT (version) DO UPDATE SET applied_at = NOW();
