-- ==============================================================================
-- MARMOT STREETWEAR | SUPABASE DATABASE SCHEMA & HARDENED RLS POLICIES
-- Execute this script in your Supabase Project SQL Editor (Dashboard > SQL Editor)
-- ==============================================================================

-- Enable UUID & Crypto extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 0. HELPER FUNCTION: IS_ADMIN
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (
    COALESCE(auth.jwt() ->> 'role', '') = 'admin' OR 
    COALESCE(auth.jwt() ->> 'email', '') = 'admin@marmot.com' OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role, anon;

-- ------------------------------------------------------------------------------
-- 1. PROFILES (Users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'customer',
  phone TEXT,
  cpf TEXT,
  addresses JSONB DEFAULT '[]'::jsonb,
  is_verified BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles read for owner or admin" ON public.profiles;
DROP POLICY IF EXISTS "Perfis podem ser lidos publicamente ou pelo dono" ON public.profiles;
DROP POLICY IF EXISTS "Profiles read restricted to owner and admin" ON public.profiles;

CREATE POLICY "Profiles read restricted to owner and admin"
  ON public.profiles FOR SELECT
  USING (auth.uid()::text = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Usuário pode atualizar apenas seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update restricted to owner and admin" ON public.profiles;

CREATE POLICY "Profiles update restricted to owner and admin"
  ON public.profiles FOR UPDATE
  USING (auth.uid()::text = id OR public.is_admin())
  WITH CHECK (auth.uid()::text = id OR public.is_admin());

DROP POLICY IF EXISTS "Anyone can insert profile" ON public.profiles;
DROP POLICY IF EXISTS "Criação de novos perfis liberada" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert allowed for user or admin" ON public.profiles;

CREATE POLICY "Profiles insert allowed for user or admin"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid()::text = id OR public.is_admin() OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Profiles delete only for admin" ON public.profiles;
CREATE POLICY "Profiles delete only for admin"
  ON public.profiles FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 1.1 USER ADDRESSES (Endereços Salvos dos Clientes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  cep TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Addresses select restricted to owner and admin" ON public.user_addresses;
CREATE POLICY "Addresses select restricted to owner and admin"
  ON public.user_addresses FOR SELECT
  USING (auth.uid()::text = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Addresses insert restricted to owner and admin" ON public.user_addresses;
CREATE POLICY "Addresses insert restricted to owner and admin"
  ON public.user_addresses FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR public.is_admin() OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Addresses update restricted to owner and admin" ON public.user_addresses;
CREATE POLICY "Addresses update restricted to owner and admin"
  ON public.user_addresses FOR UPDATE
  USING (auth.uid()::text = user_id OR public.is_admin())
  WITH CHECK (auth.uid()::text = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Addresses delete restricted to owner and admin" ON public.user_addresses;
CREATE POLICY "Addresses delete restricted to owner and admin"
  ON public.user_addresses FOR DELETE
  USING (auth.uid()::text = user_id OR public.is_admin());

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses (user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_cep ON public.user_addresses (cep);

-- ------------------------------------------------------------------------------
-- 2. CATEGORIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  image TEXT,
  subcategories JSONB DEFAULT '[]'::jsonb,
  product_count INT DEFAULT 0,
  "order" INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories are publicly readable" ON public.categories;
DROP POLICY IF EXISTS "Categorias visíveis para todos" ON public.categories;
CREATE POLICY "Categories are publicly readable"
  ON public.categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Categories modification allowed" ON public.categories;
DROP POLICY IF EXISTS "Gerenciamento de categorias" ON public.categories;
DROP POLICY IF EXISTS "Categories write restricted to admin" ON public.categories;

CREATE POLICY "Categories write restricted to admin"
  ON public.categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. PRODUCTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  promo_price NUMERIC(10, 2),
  category TEXT NOT NULL,
  subcategory TEXT,
  collection TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  review_count INT DEFAULT 0,
  stock_count INT DEFAULT 20,
  sku TEXT,
  sizes JSONB DEFAULT '["P", "M", "G", "GG"]'::jsonb,
  colors JSONB DEFAULT '[{"color": "black", "colorName": "Black", "colorHex": "#121212"}]'::jsonb,
  image TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  details JSONB DEFAULT '[]'::jsonb,
  care_instructions JSONB DEFAULT '[]'::jsonb,
  composition JSONB DEFAULT '[]'::jsonb,
  weight NUMERIC(6, 3) DEFAULT 0.35,
  height NUMERIC(6, 2) DEFAULT 4.0,
  width NUMERIC(6, 2) DEFAULT 20.0,
  length NUMERIC(6, 2) DEFAULT 25.0,
  is_new_release BOOLEAN DEFAULT false,
  is_best_seller BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Products are publicly readable" ON public.products;
DROP POLICY IF EXISTS "Produtos disponíveis para visualização pública" ON public.products;
CREATE POLICY "Products are publicly readable"
  ON public.products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Products modification allowed" ON public.products;
DROP POLICY IF EXISTS "Gerenciamento total de produtos" ON public.products;
DROP POLICY IF EXISTS "Products write restricted to admin" ON public.products;

CREATE POLICY "Products write restricted to admin"
  ON public.products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. ORDERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_cpf TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  shipping_address JSONB DEFAULT '{}'::jsonb,
  shipping_option JSONB DEFAULT '{}'::jsonb,
  payment_method TEXT,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'Aguardando Pagamento',
  payment_status TEXT DEFAULT 'Pendente',
  shipping_status TEXT DEFAULT 'Aguardando preparação',
  tracking_code TEXT,
  tracking_url TEXT,
  paid_at TIMESTAMPTZ,
  separation_started_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  in_transit_at TIMESTAMPTZ,
  out_for_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  mercado_pago_payment_id TEXT,
  mercado_pago_preference_id TEXT,
  melhor_envio_shipment_id TEXT,
  shipping_label_url TEXT,
  history JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for existing instances of public.orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'Aguardando preparação',
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS separation_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS in_transit_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS out_for_delivery_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mercado_pago_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS mercado_pago_preference_id TEXT,
  ADD COLUMN IF NOT EXISTS melhor_envio_shipment_id TEXT,
  ADD COLUMN IF NOT EXISTS shipping_label_url TEXT;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Orders can be created and queried" ON public.orders;
DROP POLICY IF EXISTS "Criação e consulta de pedidos" ON public.orders;
DROP POLICY IF EXISTS "Orders select restricted to buyer and admin" ON public.orders;

CREATE POLICY "Orders select restricted to buyer and admin"
  ON public.orders FOR SELECT
  USING (
    auth.uid()::text = user_id OR 
    (auth.jwt() ->> 'email' IS NOT NULL AND auth.jwt() ->> 'email' = customer_email) OR 
    public.is_admin()
  );

DROP POLICY IF EXISTS "Orders insert allowed for checkout" ON public.orders;
CREATE POLICY "Orders insert allowed for checkout"
  ON public.orders FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Orders update restricted to admin" ON public.orders;
CREATE POLICY "Orders update restricted to admin"
  ON public.orders FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Orders delete restricted to admin" ON public.orders;
CREATE POLICY "Orders delete restricted to admin"
  ON public.orders FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. COUPONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
  code TEXT PRIMARY KEY,
  discount_percentage NUMERIC(5, 2),
  discount_value NUMERIC(10, 2),
  discount_type TEXT DEFAULT 'percentage',
  min_order_value NUMERIC(10, 2) DEFAULT 0,
  description TEXT,
  active BOOLEAN DEFAULT true,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coupons are viewable by everyone" ON public.coupons;
DROP POLICY IF EXISTS "Cupons visualizáveis" ON public.coupons;
CREATE POLICY "Coupons are viewable by everyone"
  ON public.coupons FOR SELECT
  USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "Coupons management allowed" ON public.coupons;
DROP POLICY IF EXISTS "Gerenciamento de cupons" ON public.coupons;
DROP POLICY IF EXISTS "Coupons write restricted to admin" ON public.coupons;

CREATE POLICY "Coupons write restricted to admin"
  ON public.coupons FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. FAVORITES / WISHLIST
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.favorites (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their favorites" ON public.favorites;
DROP POLICY IF EXISTS "Favoritos do usuário" ON public.favorites;
DROP POLICY IF EXISTS "Favorites select for owner and admin" ON public.favorites;

CREATE POLICY "Favorites select for owner and admin"
  ON public.favorites FOR SELECT
  USING (auth.uid()::text = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Favorites write for owner and admin" ON public.favorites;
CREATE POLICY "Favorites write for owner and admin"
  ON public.favorites FOR ALL
  USING (auth.uid()::text = user_id OR public.is_admin())
  WITH CHECK (auth.uid()::text = user_id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  email TEXT,
  user_id TEXT,
  ip TEXT,
  status TEXT DEFAULT 'info',
  details TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Audit logs access" ON public.audit_logs;
DROP POLICY IF EXISTS "Registro de logs de auditoria" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs view only for admin" ON public.audit_logs;

CREATE POLICY "Audit logs view only for admin"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Audit logs insert allowed for system" ON public.audit_logs;
CREATE POLICY "Audit logs insert allowed for system"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Audit logs delete restricted to admin" ON public.audit_logs;
CREATE POLICY "Audit logs delete restricted to admin"
  ON public.audit_logs FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8. STORE SETTINGS & BANNERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  store_name TEXT DEFAULT 'MARMOT Streetwear',
  contact_email TEXT DEFAULT 'contato@marmotstreetwear.com.br',
  support_phone TEXT DEFAULT '+55 (11) 99999-9999',
  free_shipping_threshold NUMERIC(10, 2) DEFAULT 399.00,
  banner_alert TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store settings readable" ON public.store_settings;
DROP POLICY IF EXISTS "Configurações da loja públicas" ON public.store_settings;
CREATE POLICY "Store settings readable"
  ON public.store_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Store settings manageable" ON public.store_settings;
DROP POLICY IF EXISTS "Edição das configurações da loja" ON public.store_settings;
DROP POLICY IF EXISTS "Store settings write restricted to admin" ON public.store_settings;

CREATE POLICY "Store settings write restricted to admin"
  ON public.store_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.store_banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  button_text TEXT,
  link_url TEXT NOT NULL DEFAULT '/shop',
  image_url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  "order" INT DEFAULT 0,
  placement TEXT DEFAULT 'hero',
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.store_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store banners readable by public" ON public.store_banners;
CREATE POLICY "Store banners readable by public"
  ON public.store_banners FOR SELECT
  USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "Store banners write restricted to admin" ON public.store_banners;
CREATE POLICY "Store banners write restricted to admin"
  ON public.store_banners FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 9. RETURNS & EXCHANGES (RMA)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.returns (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  reason TEXT NOT NULL,
  description TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'Solicitada',
  tracking_code TEXT,
  history JSONB DEFAULT '[]'::jsonb,
  admin_notes TEXT,
  refund_amount NUMERIC(10, 2),
  restock_completed BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Returns select for owner or admin" ON public.returns;
CREATE POLICY "Returns select for owner or admin"
  ON public.returns FOR SELECT
  USING (
    auth.uid()::text = user_id OR
    (auth.jwt() ->> 'email' IS NOT NULL AND auth.jwt() ->> 'email' = customer_email) OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Returns insert for customer or admin" ON public.returns;
CREATE POLICY "Returns insert for customer or admin"
  ON public.returns FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id OR
    (auth.jwt() ->> 'email' IS NOT NULL AND auth.jwt() ->> 'email' = customer_email) OR
    public.is_admin() OR
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Returns update restricted to admin" ON public.returns;
CREATE POLICY "Returns update restricted to admin"
  ON public.returns FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 10. INVENTORY MOVEMENTS (AUDIT TRAIL)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_title TEXT NOT NULL,
  sku TEXT,
  variant JSONB DEFAULT '{}'::jsonb,
  quantity_change INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  reason TEXT NOT NULL,
  order_id TEXT,
  return_id TEXT,
  user_or_admin TEXT NOT NULL,
  note TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inventory movements view only for admin" ON public.inventory_movements;
CREATE POLICY "Inventory movements view only for admin"
  ON public.inventory_movements FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Inventory movements insert allowed" ON public.inventory_movements;
CREATE POLICY "Inventory movements insert allowed"
  ON public.inventory_movements FOR INSERT
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 13. ORDER ITEMS (Normalized Snapshot Table)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  title TEXT NOT NULL,
  sku TEXT,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  color_name TEXT,
  color_hex TEXT,
  image TEXT,
  quantity INT NOT NULL CHECK (quantity > 0),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  weight NUMERIC(6, 3) DEFAULT 0.35,
  height NUMERIC(6, 2) DEFAULT 4.0,
  width NUMERIC(6, 2) DEFAULT 20.0,
  length NUMERIC(6, 2) DEFAULT 25.0,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order items readable by order owner or admin" ON public.order_items;
CREATE POLICY "Order items readable by order owner or admin"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = public.order_items.order_id
        AND (o.user_id = auth.uid()::text OR (auth.jwt() ->> 'email' IS NOT NULL AND o.customer_email = auth.jwt() ->> 'email') OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Order items insert allowed" ON public.order_items;
CREATE POLICY "Order items insert allowed"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Order items update/delete restricted to admin" ON public.order_items;
CREATE POLICY "Order items update/delete restricted to admin"
  ON public.order_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 14. PRODUCT REVIEWS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id TEXT,
  order_id TEXT,
  user_name TEXT NOT NULL,
  user_email TEXT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  comment TEXT NOT NULL,
  verified_purchase BOOLEAN DEFAULT false,
  likes INT DEFAULT 0,
  status TEXT DEFAULT 'published',
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published reviews readable by everyone" ON public.product_reviews;
CREATE POLICY "Published reviews readable by everyone"
  ON public.product_reviews FOR SELECT
  USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert reviews" ON public.product_reviews;
CREATE POLICY "Users can insert reviews"
  ON public.product_reviews FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Reviews moderation restricted to admin" ON public.product_reviews;
CREATE POLICY "Reviews moderation restricted to admin"
  ON public.product_reviews FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 15. NEWSLETTER SUBSCRIBERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'subscribed',
  source TEXT DEFAULT 'website',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Newsletter viewable only by admin" ON public.newsletter_subscribers;
CREATE POLICY "Newsletter viewable only by admin"
  ON public.newsletter_subscribers FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 16. COUPON REDEMPTIONS (Tracking Usage Limits)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id TEXT PRIMARY KEY,
  coupon_id TEXT NOT NULL,
  coupon_code TEXT NOT NULL,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id TEXT,
  customer_email TEXT NOT NULL,
  discount_amount NUMERIC(10, 2) NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coupon redemptions read by owner or admin" ON public.coupon_redemptions;
CREATE POLICY "Coupon redemptions read by owner or admin"
  ON public.coupon_redemptions FOR SELECT
  USING (auth.uid()::text = user_id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 17. SHIPMENT EVENTS & TRACKING HISTORY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipment_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tracking_code TEXT NOT NULL,
  carrier TEXT NOT NULL,
  status TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  event_date TIMESTAMPTZ DEFAULT NOW(),
  raw_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shipment events readable by order buyer or admin" ON public.shipment_events;
CREATE POLICY "Shipment events readable by order buyer or admin"
  ON public.shipment_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = public.shipment_events.order_id
        AND (o.user_id = auth.uid()::text OR o.customer_email = auth.jwt() ->> 'email' OR public.is_admin())
    )
  );

-- ------------------------------------------------------------------------------
-- 18. EMAIL LOGS (Transactional Notifications Audit)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_logs (
  id TEXT PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT NOT NULL,
  order_id TEXT,
  user_id TEXT,
  status TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Email logs viewable only by admin" ON public.email_logs;
CREATE POLICY "Email logs viewable only by admin"
  ON public.email_logs FOR SELECT
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- INDEXES FOR PERFORMANCE
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products (slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products (status);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders (customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON public.returns (order_id);
CREATE INDEX IF NOT EXISTS idx_returns_user_id ON public.returns (user_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON public.returns (status);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON public.inventory_movements (product_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs (created_at DESC);

-- ------------------------------------------------------------------------------
-- 19. ATOMIC CONCURRENCY & IDEMPOTENCY TABLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  order_id TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error TEXT,
  CONSTRAINT uq_provider_event UNIQUE (provider, event_id)
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Webhook events viewable only by admin" ON public.webhook_events;
CREATE POLICY "Webhook events viewable only by admin"
  ON public.webhook_events FOR SELECT
  USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.payment_effects (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL,
  effect_type TEXT NOT NULL DEFAULT 'payment_approved',
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  amount NUMERIC(10, 2),
  currency TEXT DEFAULT 'BRL',
  CONSTRAINT uq_order_effect UNIQUE (order_id, effect_type)
);

ALTER TABLE public.payment_effects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Payment effects viewable only by admin" ON public.payment_effects;
CREATE POLICY "Payment effects viewable only by admin"
  ON public.payment_effects FOR SELECT
  USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.shipment_operations (
  order_id TEXT PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  shipment_id TEXT,
  tracking_code TEXT,
  print_url TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shipment_operations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Shipment operations viewable only by admin" ON public.shipment_operations;
CREATE POLICY "Shipment operations viewable only by admin"
  ON public.shipment_operations FOR SELECT
  USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.refund_operations (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  idempotency_key TEXT UNIQUE,
  amount NUMERIC(10, 2) NOT NULL,
  reason TEXT,
  admin_email TEXT,
  status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'processing', 'completed', 'failed', 'unknown'
  provider_refund_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.refund_operations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Refund operations viewable only by admin" ON public.refund_operations;
CREATE POLICY "Refund operations viewable only by admin"
  ON public.refund_operations FOR SELECT
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 20. ATOMIC RPCs FOR TRANSACTIONS AND CONCURRENCY HARDENING
-- ------------------------------------------------------------------------------

-- RPC 1: Atomic Inventory Deduction with anti-negative guarantee
CREATE OR REPLACE FUNCTION public.deduct_inventory_atomic(
  p_product_id TEXT,
  p_quantity INT,
  p_order_id TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT 'Venda Confirmada'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_stock INT;
  v_new_stock INT;
  v_prod_title TEXT;
  v_prod_sku TEXT;
BEGIN
  -- Lock row with FOR UPDATE
  SELECT stock_count, title, sku INTO v_current_stock, v_prod_title, v_prod_sku
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Produto não encontrado');
  END IF;

  IF v_current_stock < p_quantity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Estoque insuficiente para completar o pedido',
      'current_stock', v_current_stock,
      'requested_quantity', p_quantity
    );
  END IF;

  v_new_stock := v_current_stock - p_quantity;

  UPDATE public.products
  SET
    stock_count = v_new_stock,
    status = CASE WHEN v_new_stock <= 0 THEN 'out_of_stock' ELSE 'active' END,
    updated_at = NOW()
  WHERE id = p_product_id;

  INSERT INTO public.inventory_movements (
    id, product_id, product_title, sku, quantity_change, previous_stock, new_stock, reason, order_id, user_or_admin, created_at
  ) VALUES (
    'inv-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6),
    p_product_id,
    COALESCE(v_prod_title, 'Produto'),
    v_prod_sku,
    -p_quantity,
    v_current_stock,
    v_new_stock,
    p_reason,
    p_order_id,
    'system',
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'previous_stock', v_current_stock,
    'new_stock', v_new_stock,
    'deducted', p_quantity
  );
END;
$$;

-- RPC 2: Atomic Payment Refund with strict math limit & idempotency key
CREATE OR REPLACE FUNCTION public.process_refund_atomic(
  p_order_id TEXT,
  p_amount NUMERIC,
  p_reason TEXT,
  p_admin_name TEXT,
  p_admin_email TEXT,
  p_idempotency_key TEXT DEFAULT NULL,
  p_provider_refund_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order RECORD;
  v_existing_ref RECORD;
  v_already_refunded NUMERIC;
  v_total NUMERIC;
  v_new_refunded NUMERIC;
  v_is_full BOOLEAN;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- 1. Check idempotency key if provided
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing_ref
    FROM public.refund_operations
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND AND v_existing_ref.status = 'completed' THEN
      RETURN jsonb_build_object(
        'success', true,
        'already_processed', true,
        'refund_id', v_existing_ref.id,
        'refunded_amount', v_existing_ref.amount,
        'order_id', p_order_id
      );
    END IF;
  END IF;

  -- 2. Lock row with FOR UPDATE
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado');
  END IF;

  v_total := COALESCE(v_order.total, 0);
  v_already_refunded := COALESCE(
    (v_order.data->'paymentDetails'->>'refundedAmount')::NUMERIC,
    (v_order.data->>'refundedAmount')::NUMERIC,
    0
  );

  IF (v_already_refunded + p_amount) > (v_total + 0.01) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Reembolso de R$ %s ultrapassa o saldo disponível do pedido (Total: R$ %s, Já reembolsado: R$ %s)', p_amount, v_total, v_already_refunded),
      'already_refunded', v_already_refunded,
      'total', v_total
    );
  END IF;

  v_new_refunded := v_already_refunded + p_amount;
  v_is_full := (v_new_refunded >= (v_total - 0.01));

  UPDATE public.orders
  SET
    payment_status = 'Reembolsado',
    status = CASE WHEN v_is_full THEN 'Reembolsado' ELSE status END,
    data = jsonb_set(
      COALESCE(data, '{}'::jsonb),
      '{paymentDetails}',
      COALESCE(data->'paymentDetails', '{}'::jsonb) || jsonb_build_object(
        'refundedAmount', v_new_refunded,
        'refundedAt', v_now::text
      )
    ),
    updated_at = v_now
  WHERE id = p_order_id;

  INSERT INTO public.refund_operations (
    id, order_id, idempotency_key, amount, reason, admin_email, status, provider_refund_id, created_at, updated_at
  )
  VALUES (
    'ref-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6),
    p_order_id,
    p_idempotency_key,
    p_amount,
    p_reason,
    p_admin_email,
    'completed',
    p_provider_refund_id,
    v_now,
    v_now
  )
  ON CONFLICT (idempotency_key) DO UPDATE
  SET status = 'completed', provider_refund_id = EXCLUDED.provider_refund_id, updated_at = v_now;

  RETURN jsonb_build_object(
    'success', true,
    'already_processed', false,
    'previous_refunded', v_already_refunded,
    'refunded_amount', v_new_refunded,
    'is_full_refund', v_is_full,
    'order_id', p_order_id
  );
END;
$$;

-- RPC 3: Atomic Coupon Redemption with limit enforcement
CREATE OR REPLACE FUNCTION public.redeem_coupon_atomic(
  p_coupon_code TEXT,
  p_order_id TEXT,
  p_user_id TEXT,
  p_customer_email TEXT,
  p_subtotal NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_coupon RECORD;
  v_usage_count INT;
  v_max_usage INT;
  v_discount NUMERIC;
BEGIN
  -- Lock coupon row
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE UPPER(code) = UPPER(p_coupon_code)
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Cupom não encontrado');
  END IF;

  IF NOT v_coupon.active THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Cupom inativo ou expirado');
  END IF;

  IF v_coupon.min_order_value > 0 AND p_subtotal < v_coupon.min_order_value THEN
    RETURN jsonb_build_object('valid', false, 'error', format('Valor mínimo do pedido para este cupom é R$ %s', v_coupon.min_order_value));
  END IF;

  v_max_usage := COALESCE((v_coupon.data->>'maxUsage')::INT, (v_coupon.data->>'usageLimit')::INT, NULL);
  
  IF v_max_usage IS NOT NULL THEN
    SELECT COUNT(*) INTO v_usage_count
    FROM public.coupon_redemptions
    WHERE UPPER(coupon_code) = UPPER(p_coupon_code);

    IF v_usage_count >= v_max_usage THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Limite de uso deste cupom já foi atingido');
    END IF;
  END IF;

  IF v_coupon.discount_percentage > 0 THEN
    v_discount := ROUND((p_subtotal * v_coupon.discount_percentage / 100.0), 2);
  ELSE
    v_discount := LEAST(COALESCE(v_coupon.discount_value, 0), p_subtotal);
  END IF;

  INSERT INTO public.coupon_redemptions (
    id, coupon_id, coupon_code, order_id, user_id, customer_email, discount_amount, redeemed_at
  ) VALUES (
    'red-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6),
    v_coupon.code,
    v_coupon.code,
    p_order_id,
    p_user_id,
    p_customer_email,
    v_discount,
    NOW()
  );

  RETURN jsonb_build_object(
    'valid', true,
    'discount', v_discount,
    'coupon_code', v_coupon.code
  );
END;
$$;

-- RPC 4: Webhook Event Claiming (Distributed Idempotency)
CREATE OR REPLACE FUNCTION public.claim_webhook_event(
  p_provider TEXT,
  p_event_id TEXT,
  p_event_type TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rec RECORD;
BEGIN
  SELECT * INTO v_rec
  FROM public.webhook_events
  WHERE provider = p_provider AND event_id = p_event_id;

  IF FOUND THEN
    IF v_rec.status = 'completed' THEN
      RETURN jsonb_build_object('should_process', false, 'status', 'already_completed');
    ELSIF v_rec.status = 'processing' AND (NOW() - v_rec.received_at) < INTERVAL '2 minutes' THEN
      RETURN jsonb_build_object('should_process', false, 'status', 'in_flight');
    ELSE
      UPDATE public.webhook_events
      SET status = 'processing', received_at = NOW()
      WHERE provider = p_provider AND event_id = p_event_id;
      RETURN jsonb_build_object('should_process', true, 'status', 'retrying');
    END IF;
  END IF;

  INSERT INTO public.webhook_events (id, provider, event_id, event_type, payload, status, received_at)
  VALUES (
    p_provider || '_' || p_event_id,
    p_provider,
    p_event_id,
    p_event_type,
    p_payload,
    'processing',
    NOW()
  );

  RETURN jsonb_build_object('should_process', true, 'status', 'new');
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('should_process', false, 'status', 'in_flight_concurrent');
END;
$$;

-- RPC 5: Complete Webhook Event
CREATE OR REPLACE FUNCTION public.complete_webhook_event(
  p_provider TEXT,
  p_event_id TEXT,
  p_order_id TEXT DEFAULT NULL,
  p_error TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.webhook_events
  SET
    status = CASE WHEN p_error IS NOT NULL THEN 'failed' ELSE 'completed' END,
    order_id = COALESCE(p_order_id, order_id),
    error = p_error,
    completed_at = NOW()
  WHERE provider = p_provider AND event_id = p_event_id;
END;
$$;

-- RPC 6: Atomic Approved Payment with Deduplication of Financial Effects
CREATE OR REPLACE FUNCTION public.apply_approved_payment_atomic(
  p_order_id TEXT,
  p_payment_id TEXT,
  p_transaction_amount NUMERIC,
  p_currency TEXT,
  p_payment_method TEXT,
  p_date_approved TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order RECORD;
  v_items_array JSONB;
  v_elem JSONB;
  v_prod_id TEXT;
  v_qty INT;
  v_was_already_paid BOOLEAN;
  v_effect_exists BOOLEAN;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- 1. Check if business effect already exists in payment_effects
  SELECT EXISTS(
    SELECT 1 FROM public.payment_effects
    WHERE order_id = p_order_id AND effect_type = 'payment_approved'
  ) INTO v_effect_exists;

  -- 2. Lock order row
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado');
  END IF;

  IF UPPER(p_currency) <> 'BRL' THEN
    UPDATE public.orders
    SET payment_status = 'Erro', updated_at = v_now
    WHERE id = p_order_id;
    RETURN jsonb_build_object('success', false, 'error', 'Moeda inválida. Apenas BRL é aceito.');
  END IF;

  IF p_transaction_amount < (v_order.total - 0.05) THEN
    UPDATE public.orders
    SET payment_status = 'Pagamento Divergente', updated_at = v_now
    WHERE id = p_order_id;
    RETURN jsonb_build_object('success', false, 'error', 'Valor divergente do total esperado');
  END IF;

  v_was_already_paid := (v_order.payment_status = 'Pago' OR v_order.status = 'Pagamento Aprovado' OR v_effect_exists);

  IF v_was_already_paid THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'order_id', p_order_id,
      'status', v_order.status
    );
  END IF;

  -- Insert payment effect (guarantees business idempotency across distinct webhook events)
  INSERT INTO public.payment_effects (
    id, order_id, payment_id, effect_type, applied_at, amount, currency
  ) VALUES (
    'eff-' || p_order_id || '-approved',
    p_order_id,
    p_payment_id,
    'payment_approved',
    v_now,
    p_transaction_amount,
    p_currency
  ) ON CONFLICT (order_id, effect_type) DO NOTHING;

  UPDATE public.orders
  SET
    status = 'Pagamento Aprovado',
    payment_status = 'Pago',
    data = jsonb_set(
      COALESCE(data, '{}'::jsonb),
      '{paymentDetails}',
      COALESCE(data->'paymentDetails', '{}'::jsonb) || jsonb_build_object(
        'paymentId', p_payment_id,
        'paidAt', COALESCE(p_date_approved, v_now::text),
        'amount', p_transaction_amount,
        'currency', p_currency,
        'paymentMethod', p_payment_method
      )
    ),
    updated_at = v_now
  WHERE id = p_order_id;

  v_items_array := v_order.items;
  IF v_items_array IS NOT NULL AND jsonb_array_length(v_items_array) > 0 THEN
    FOR v_elem IN SELECT * FROM jsonb_array_elements(v_items_array)
    LOOP
      v_prod_id := v_elem->>'productId';
      v_qty := COALESCE((v_elem->>'quantity')::INT, 1);
      IF v_prod_id IS NOT NULL THEN
        PERFORM public.deduct_inventory_atomic(v_prod_id, v_qty, p_order_id, 'Venda Aprovada (Mercado Pago)');
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'already_processed', false,
    'order_id', p_order_id,
    'status', 'Pagamento Aprovado'
  );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.deduct_inventory_atomic(TEXT, INT, TEXT, TEXT) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.process_refund_atomic(TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.redeem_coupon_atomic(TEXT, TEXT, TEXT, TEXT, NUMERIC) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.claim_webhook_event(TEXT, TEXT, TEXT, JSONB) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.complete_webhook_event(TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.apply_approved_payment_atomic(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT) TO authenticated, service_role, anon;

-- ------------------------------------------------------------------------------
-- TRIGGER: Prevenir Elevação Indevida de Privilégios (role = 'admin') em Profiles
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.role <> OLD.role AND NOT public.is_admin() THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- ------------------------------------------------------------------------------
-- TRIGGER AUTOMÁTICO: Sincronizar Novos Cadastros do Supabase Auth para Profiles
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  assigned_role TEXT;
BEGIN
  -- Strict role assignment: Never trust client-supplied raw_user_meta_data for role
  IF LOWER(NEW.email) = 'admin@marmot.com' OR NEW.raw_app_meta_data->>'role' = 'admin' THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'customer';
  END IF;

  INSERT INTO public.profiles (id, email, name, role, phone, cpf, is_verified, created_at, updated_at)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    assigned_role,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
    NEW.email_confirmed_at IS NOT NULL,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 19. SUPABASE STORAGE: BUCKET 'product-images' & RLS POLICIES
-- ==============================================================================

-- 1. Criação do bucket 'product-images' público com limite de 10MB
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'];

-- 2. Políticas de Leitura Pública
DROP POLICY IF EXISTS "Public Access to product-images" ON storage.objects;
CREATE POLICY "Public Access to product-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- 3. Políticas de Inserção / Upload (Admin ou Service Role)
DROP POLICY IF EXISTS "Allow Admin Upload to product-images" ON storage.objects;
CREATE POLICY "Allow Admin Upload to product-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND (public.is_admin() OR auth.role() = 'service_role' OR auth.role() = 'authenticated'));

-- 4. Políticas de Atualização
DROP POLICY IF EXISTS "Allow Admin Update on product-images" ON storage.objects;
CREATE POLICY "Allow Admin Update on product-images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND (public.is_admin() OR auth.role() = 'service_role' OR auth.role() = 'authenticated'));

-- 5. Políticas de Exclusão
DROP POLICY IF EXISTS "Allow Admin Delete on product-images" ON storage.objects;
CREATE POLICY "Allow Admin Delete on product-images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND (public.is_admin() OR auth.role() = 'service_role' OR auth.role() = 'authenticated'));

-- Recarrega o cache do PostgREST
NOTIFY pgrst, 'reload schema';

