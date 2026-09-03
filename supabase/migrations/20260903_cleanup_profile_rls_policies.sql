-- Migration: 20260903_cleanup_profile_rls_policies
-- Purpose:
-- 1. Consolidate public.profiles RLS to a single canonical generation (profiles_*_policy)
--    and drop all redundant legacy policies ("Profiles select allowed for user or admin", etc.)
-- 2. Optimize RLS expressions with (select auth.uid()), (select auth.role()), (select auth.jwt()) for InitPlan caching
-- 3. Eliminate duplicate index uq_payment_effects_gateway_payment on public.payment_effects
-- 4. Eliminate duplicate indexes on favorites and orders (idx_favorites_user, idx_orders_email)
-- 5. Revoke execute on trigger functions from anon/authenticated so they cannot be called as RPCs
-- 6. Lock is_admin RPC strictly to service_role
-- 7. Drop legacy redundant trigger trg_protect_profile_role and protect_profile_role()
-- 8. Idempotently track schema_migrations

-- =========================================================================
-- 1. CONSOLIDATE PROFILES RLS POLICIES
-- =========================================================================
DROP POLICY IF EXISTS "Profiles read restricted to owner and admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update restricted to owner and admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert restricted to owner and admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles delete restricted to owner and admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select allowed for user or admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update allowed for user or admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert allowed for user or admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles delete only for admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- Canonical SELECT policy: Owner can read self; service_role and verified JWT admins can read all
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT
  USING (
    (select auth.role()) = 'service_role'
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    OR ((select auth.uid()) IS NOT NULL AND ((select auth.uid()))::text = id::text)
  );

-- Canonical UPDATE policy: Owner can update self; service_role and verified JWT admins can update all
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE
  USING (
    (select auth.role()) = 'service_role'
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    OR ((select auth.uid()) IS NOT NULL AND ((select auth.uid()))::text = id::text)
  )
  WITH CHECK (
    (select auth.role()) = 'service_role'
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    OR ((select auth.uid()) IS NOT NULL AND ((select auth.uid()))::text = id::text)
  );

-- Canonical INSERT policy: Authenticated users can insert their own profile; admins/service_role can insert all
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT
  WITH CHECK (
    (select auth.role()) = 'service_role'
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    OR ((select auth.uid()) IS NOT NULL AND ((select auth.uid()))::text = id::text)
  );

-- Canonical DELETE policy: Strictly restricted to service_role and verified JWT admins
CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE
  USING (
    (select auth.role()) = 'service_role'
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

-- =========================================================================
-- 2. ELIMINATE DUPLICATE INDEXES (PERFORMANCE ADVISOR)
-- =========================================================================
-- Drop redundant standalone index on payment_effects(gateway, payment_id)
-- Retains the unique constraint payment_effects_gateway_payment_id_key
DROP INDEX IF EXISTS public.uq_payment_effects_gateway_payment;

-- Drop redundant indexes on favorites and orders
DROP INDEX IF EXISTS public.idx_favorites_user;
DROP INDEX IF EXISTS public.idx_orders_email;

-- =========================================================================
-- 3. REMOVE LEGACY TRIGGER & FUNCTION
-- =========================================================================
DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
DROP FUNCTION IF EXISTS public.protect_profile_role();

-- =========================================================================
-- 4. LOCK TRIGGER FUNCTIONS & INTERNAL RPCS
-- =========================================================================
-- Redefine public.is_admin() to strictly rely on service_role and JWT app_metadata
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (select auth.role()) = 'service_role' THEN
    RETURN TRUE;
  END IF;

  RETURN COALESCE(((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin', FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (select auth.role()) = 'service_role' THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Lock column-level privileges on public.profiles
REVOKE UPDATE ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT UPDATE (name, phone, cpf, avatar_url, addresses, updated_at, data) ON public.profiles TO authenticated;

REVOKE ALL ON FUNCTION public.enforce_profile_insert_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_profile_role_escalation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_profile_insert_role() TO service_role;
GRANT EXECUTE ON FUNCTION public.prevent_profile_role_escalation() TO service_role;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;

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
  ('20260903_lock_profile_trigger_functions', 'Revoke execute on trigger functions from anon/authenticated, remove legacy trigger, clean duplicate indexes, and optimize InitPlan RLS'),
  ('20260903_cleanup_profile_rls_policies', 'Consolidate public.profiles RLS policies, remove duplicate payment_effects index, drop legacy triggers, lock trigger functions')
ON CONFLICT (version) DO UPDATE SET applied_at = NOW();
