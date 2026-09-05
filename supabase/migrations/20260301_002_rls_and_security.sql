-- =========================================================================
-- MIGRATION: 20260301_002_rls_and_security.sql
-- DESCRIPTION: Funções de autorização, triggers de cadastro seguro e RLS Policies
-- =========================================================================

-- 1. Helper function to check if the caller is an administrator (Strictly service_role / JWT app_metadata only)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT (COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
         OR (COALESCE(auth.role(), '') = 'service_role');
$$;

-- 2. Trigger for new user registration (Prevents client-side privilege escalation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  assigned_role TEXT := 'customer';
BEGIN
  -- Check if user is registered with authorized admin email
  IF LOWER(NEW.email) IN ('admin@marmot.com', 'admin@marmot.com.br') THEN
    assigned_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    assigned_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. ENABLE RLS ON ALL PUBLIC TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR PROFILES
DROP POLICY IF EXISTS "Profiles are readable by owner or admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  USING (
    (select auth.role()) = 'service_role'
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    OR ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = id)
  );

DROP POLICY IF EXISTS "Profiles can be updated by owner (except role)" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy"
  ON public.profiles FOR UPDATE
  USING (
    (select auth.role()) = 'service_role'
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    OR ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = id)
  )
  WITH CHECK (
    (select auth.role()) = 'service_role'
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    OR ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = id)
  );

DROP POLICY IF EXISTS "Profiles can be inserted by owner" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy"
  ON public.profiles FOR INSERT
  WITH CHECK (
    (select auth.role()) = 'service_role'
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    OR ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = id)
  );

-- 5. RLS POLICIES FOR PRODUCTS
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Products are manageable by admins" ON public.products;
CREATE POLICY "Products are manageable by admins"
  ON public.products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. RLS POLICIES FOR ORDERS
DROP POLICY IF EXISTS "Orders are viewable by owner or admin" ON public.orders;
CREATE POLICY "Orders are viewable by owner or admin"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Orders can be created by authenticated user or guest checkout" ON public.orders;
CREATE POLICY "Orders can be created by authenticated user or guest checkout"
  ON public.orders FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND user_id IS NULL) OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Orders can be updated by admin" ON public.orders;
CREATE POLICY "Orders can be updated by admin"
  ON public.orders FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. RLS POLICIES FOR USER ADDRESSES
DROP POLICY IF EXISTS "Addresses are manageable by owner" ON public.user_addresses;
CREATE POLICY "Addresses are manageable by owner"
  ON public.user_addresses FOR ALL
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 8. RLS POLICIES FOR CART ITEMS
DROP POLICY IF EXISTS "Cart items are manageable by owner" ON public.cart_items;
CREATE POLICY "Cart items are manageable by owner"
  ON public.cart_items FOR ALL
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 9. RLS POLICIES FOR WISHLIST
DROP POLICY IF EXISTS "Wishlist is manageable by owner" ON public.wishlist_items;
CREATE POLICY "Wishlist is manageable by owner"
  ON public.wishlist_items FOR ALL
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 10. RLS POLICIES FOR COUPONS
DROP POLICY IF EXISTS "Coupons are viewable by all" ON public.coupons;
CREATE POLICY "Coupons are viewable by all"
  ON public.coupons FOR SELECT
  USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "Coupons are manageable by admin" ON public.coupons;
CREATE POLICY "Coupons are manageable by admin"
  ON public.coupons FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 11. RLS POLICIES FOR SENSITIVE BACKEND TABLES (Admin & Service Role only)
DROP POLICY IF EXISTS "App settings accessible by admins" ON public.app_settings;
CREATE POLICY "App settings accessible by admins"
  ON public.app_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Webhooks accessible by admins" ON public.webhook_events;
CREATE POLICY "Webhooks accessible by admins"
  ON public.webhook_events FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Payment effects accessible by admins" ON public.payment_effects;
CREATE POLICY "Payment effects accessible by admins"
  ON public.payment_effects FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Shipment operations accessible by admins" ON public.shipment_operations;
CREATE POLICY "Shipment operations accessible by admins"
  ON public.shipment_operations FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Audit logs accessible by admins" ON public.admin_audit_logs;
CREATE POLICY "Audit logs accessible by admins"
  ON public.admin_audit_logs FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
