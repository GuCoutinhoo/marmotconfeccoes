-- ==============================================================================
-- MARMOT CONFECÇÕES - MIGRATION 20260302_006
-- P0 & P1 SECURITY BLOCKERS FINAL REMEDIATION
-- ==============================================================================
-- 1. Product reviews: Block direct client inserts via RLS (service_role only).
-- 2. Shipping quotes: Fail-closed RLS (service_role/admin writes, strict user read).
-- 3. is_admin RPC: Lockdown execution permissions (revoked from anon & authenticated).
-- 4. RLS policies refactored to inline JWT role to avoid function permission errors.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. IS_ADMIN FUNCTION LOCKDOWN (SECURITY DEFINER & STRICT SEARCH_PATH)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Service role is always admin
  IF auth.role() = 'service_role' THEN
    RETURN TRUE;
  END IF;

  -- JWT app_metadata role check
  IF COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Fallback check against profiles table
  IF auth.uid() IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    );
  END IF;

  RETURN FALSE;
END;
$$;

-- Lock down execution: Revoke from PUBLIC, anon, and authenticated
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

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

  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;

-- ------------------------------------------------------------------------------
-- 2. PRODUCT REVIEWS RLS HARDENING (FAIL-CLOSED, SERVICE_ROLE INSERT ONLY)
-- ------------------------------------------------------------------------------
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on product_reviews
DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.product_reviews;
DROP POLICY IF EXISTS "Reviews viewable by everyone" ON public.product_reviews;
DROP POLICY IF EXISTS "Published reviews readable by everyone" ON public.product_reviews;
DROP POLICY IF EXISTS "reviews_select_public" ON public.product_reviews;
DROP POLICY IF EXISTS "reviews_select_policy" ON public.product_reviews;
DROP POLICY IF EXISTS "Reviews insert allowed for authenticated" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can insert reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "reviews_insert_authenticated" ON public.product_reviews;
DROP POLICY IF EXISTS "Reviews insertable by authenticated users" ON public.product_reviews;
DROP POLICY IF EXISTS "Reviews insert allowed" ON public.product_reviews;
DROP POLICY IF EXISTS "reviews_insert_service_role_only" ON public.product_reviews;
DROP POLICY IF EXISTS "Reviews admin manage" ON public.product_reviews;
DROP POLICY IF EXISTS "Reviews moderation restricted to admin" ON public.product_reviews;
DROP POLICY IF EXISTS "Reviews manageable by admin" ON public.product_reviews;
DROP POLICY IF EXISTS "reviews_manage_admin_service_only" ON public.product_reviews;
DROP POLICY IF EXISTS "reviews_modify_policy" ON public.product_reviews;

-- SELECT: Public can view approved/published reviews; users can view their own; admins/service_role can view all
CREATE POLICY "reviews_select_policy" ON public.product_reviews
  FOR SELECT
  USING (
    status IN ('published', 'approved')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR auth.role() = 'service_role'
    OR (auth.uid() IS NOT NULL AND user_id::text = auth.uid()::text)
  );

-- INSERT: Strictly restricted to service_role and admin (direct client inserts BLOCKED)
CREATE POLICY "reviews_insert_service_role_only" ON public.product_reviews
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- UPDATE / DELETE: Restricted to service_role and admin
CREATE POLICY "reviews_manage_admin_service_only" ON public.product_reviews
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ------------------------------------------------------------------------------
-- 3. SHIPPING QUOTES RLS HARDENING (FAIL-CLOSED, STRICT USER BINDING)
-- ------------------------------------------------------------------------------
ALTER TABLE public.shipping_quotes ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on shipping_quotes
DROP POLICY IF EXISTS "Shipping quotes read" ON public.shipping_quotes;
DROP POLICY IF EXISTS "Shipping quotes write" ON public.shipping_quotes;
DROP POLICY IF EXISTS "Allow all" ON public.shipping_quotes;
DROP POLICY IF EXISTS "shipping_quotes_read" ON public.shipping_quotes;
DROP POLICY IF EXISTS "shipping_quotes_write" ON public.shipping_quotes;
DROP POLICY IF EXISTS "shipping_quotes_select_policy" ON public.shipping_quotes;
DROP POLICY IF EXISTS "shipping_quotes_write_policy" ON public.shipping_quotes;

-- SELECT: Users can only read their own quotes; service_role & admin can read all
CREATE POLICY "shipping_quotes_select_policy" ON public.shipping_quotes
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.uid() IS NOT NULL AND user_id::text = auth.uid()::text)
  );

-- INSERT / UPDATE / DELETE: Authoritative backend (service_role) & admin only
CREATE POLICY "shipping_quotes_write_policy" ON public.shipping_quotes
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ------------------------------------------------------------------------------
-- 4. REFACTOR OTHER POLICIES TO AVOID CALLING IS_ADMIN() IN EVALUATION PATHS
-- ------------------------------------------------------------------------------
-- Products write policy: use inline role check
DROP POLICY IF EXISTS "Products are manageable by admin only" ON public.products;
DROP POLICY IF EXISTS "Products admin manage" ON public.products;
CREATE POLICY "Products admin manage" ON public.products
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Store settings write policy
DROP POLICY IF EXISTS "Store settings admin manage" ON public.store_settings;
DROP POLICY IF EXISTS "Store settings manageable by admin only" ON public.store_settings;
CREATE POLICY "Store settings admin manage" ON public.store_settings
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
