-- ==============================================================================
-- MARMOT CONFECÇÕES - MIGRATION 20260902_remove_profile_role_admin_authority
-- P0 PRIVILEGE ESCALATION REMEDIATION: STRICT AUTHORITY DECOUPLING
-- ==============================================================================
-- 1. Redefine public.is_admin() to rely SOLELY on service_role and auth.jwt() app_metadata.role.
--    Eliminates all queries/fallbacks to public.profiles.
-- 2. Lock down public.is_admin() execution permissions (REVOKE from anon & authenticated).
-- 3. Lock down public.profiles.role column privileges (REVOKE UPDATE from authenticated).
-- 4. Install defensive triggers to prevent privilege escalation on INSERT and UPDATE.
-- 5. Modernize public.profiles RLS policies using inline JWT claims.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. REDEFINE IS_ADMIN FUNCTION (ZERO PROFILE QUERY, STRICT APP_METADATA ONLY)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Authoritative check 1: Direct backend service_role
  IF auth.role() = 'service_role' THEN
    RETURN TRUE;
  END IF;

  -- Authoritative check 2: Tamper-proof app_metadata role in cryptographic JWT
  -- Never inspects profiles.role or user_metadata
  RETURN COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', FALSE);
END;
$$;

-- Overload is_admin(user_id uuid) - decommission profile lookup
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Lock down function execution from non-service roles
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;

-- ------------------------------------------------------------------------------
-- 2. LOCK DOWN COLUMN PRIVILEGES ON public.profiles (REVOKE UPDATE ON 'role')
-- ------------------------------------------------------------------------------
-- Revoke table-level UPDATE from public/unprivileged roles
REVOKE UPDATE ON public.profiles FROM PUBLIC;
REVOKE UPDATE ON public.profiles FROM anon;
REVOKE UPDATE ON public.profiles FROM authenticated;

-- Grant column-level UPDATE on mutable user-owned profile attributes only
-- Explicitly omits: role, is_admin, permissions, etc.
GRANT UPDATE (name, phone, cpf, avatar_url, addresses, updated_at, data) ON public.profiles TO authenticated;

-- Defensive Trigger 1: Hard block any attempt to alter 'role' by non-service_role
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.role() != 'service_role' THEN
      RAISE EXCEPTION 'Acesso negado: a coluna role de profiles só pode ser alterada via service_role administrativo.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- Defensive Trigger 2: Force customer role on any INSERT executed by non-service_role
CREATE OR REPLACE FUNCTION public.enforce_profile_insert_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.role() != 'service_role' THEN
    NEW.role := 'customer';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_insert_role ON public.profiles;
CREATE TRIGGER trg_enforce_profile_insert_role
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_insert_role();

-- ------------------------------------------------------------------------------
-- 3. UPDATE PROFILES RLS POLICIES TO INLINE JWT CLAIMS (NO RPC DEPENDENCY)
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles select allowed for user or admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update allowed for user or admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert allowed for user or admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles delete only for admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- SELECT: Users can view their own profile; admins/service_role can view all
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.uid() IS NOT NULL AND (auth.uid())::text = id::text)
  );

-- UPDATE: Users can update their own profile; admins/service_role can update all
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.uid() IS NOT NULL AND (auth.uid())::text = id::text)
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.uid() IS NOT NULL AND (auth.uid())::text = id::text)
  );

-- INSERT: Authenticated users can insert their own profile; admins/service_role can insert all
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.uid() IS NOT NULL AND (auth.uid())::text = id::text)
  );

-- DELETE: Strictly restricted to service_role and verified JWT admins
CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE
  USING (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
