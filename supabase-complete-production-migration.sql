-- =========================================================================
-- PRODUCTION RECONCILIATION MIGRATION FOR MARMOT CONFECÇÕES
-- =========================================================================
-- Non-destructive, 100% idempotent migration for Supabase PostgreSQL.
-- Reconciles database schema, constraints, indexes, triggers, storage,
-- RLS policies and server-authoritative security functions.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 1. PROFILES (Customers and Administrators)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  cpf TEXT,
  phone TEXT,
  avatar_url TEXT,
  addresses JSONB DEFAULT '[]'::jsonb,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS addresses JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Clean sensitive credentials from profiles.data if any exists
UPDATE public.profiles
SET data = data - 'passwordHash' - 'password' - 'verificationCode' - 'resetToken' - 'resetCode' - 'session' - 'jwt' - 'secret'
WHERE data ? 'passwordHash' OR data ? 'password' OR data ? 'verificationCode' OR data ? 'resetToken';

-- =========================================================================
-- 2. PRODUCTS CATALOG
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  subtitle TEXT,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
  promo_price NUMERIC(10, 2) CHECK (promo_price IS NULL OR promo_price >= 0),
  category TEXT NOT NULL DEFAULT 'camisetas',
  subcategory TEXT,
  collection TEXT DEFAULT 'Vol. 04: Cyber Dystopia',
  tags JSONB DEFAULT '[]'::jsonb,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (rating >= 1.0 AND rating <= 5.0),
  review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  stock_count INTEGER NOT NULL DEFAULT 0 CHECK (stock_count >= 0),
  sku TEXT,
  sizes JSONB DEFAULT '[]'::jsonb,
  colors JSONB DEFAULT '[]'::jsonb,
  image TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  details JSONB DEFAULT '[]'::jsonb,
  care_instructions JSONB DEFAULT '[]'::jsonb,
  composition JSONB DEFAULT '[]'::jsonb,
  weight NUMERIC(6, 3) NOT NULL DEFAULT 0.350 CHECK (weight > 0),
  height NUMERIC(6, 2) NOT NULL DEFAULT 4.00 CHECK (height > 0),
  width NUMERIC(6, 2) NOT NULL DEFAULT 20.00 CHECK (width > 0),
  length NUMERIC(6, 2) NOT NULL DEFAULT 25.00 CHECK (length > 0),
  is_new_release BOOLEAN DEFAULT FALSE,
  is_best_seller BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS promo_price NUMERIC(10, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'camisetas';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS collection TEXT DEFAULT 'Vol. 04: Cyber Dystopia';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight NUMERIC(6, 3) NOT NULL DEFAULT 0.350;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS height NUMERIC(6, 2) NOT NULL DEFAULT 4.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS width NUMERIC(6, 2) NOT NULL DEFAULT 20.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS length NUMERIC(6, 2) NOT NULL DEFAULT 25.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_new_release BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Ensure non-null stock count without arbitrary defaults
UPDATE public.products SET stock_count = 0 WHERE stock_count IS NULL;
ALTER TABLE public.products ALTER COLUMN stock_count SET DEFAULT 0;
ALTER TABLE public.products ALTER COLUMN stock_count SET NOT NULL;

-- =========================================================================
-- 3. CATEGORIES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  image TEXT,
  subcategories JSONB DEFAULT '[]'::jsonb,
  product_count INTEGER DEFAULT 0,
  "order" INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS product_count INTEGER DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- =========================================================================
-- 4. COUPONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  code TEXT PRIMARY KEY,
  discount_percentage NUMERIC(5, 2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  discount_value NUMERIC(10, 2) DEFAULT 0 CHECK (discount_value >= 0),
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  min_order_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (min_order_value >= 0),
  description TEXT,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_type TEXT NOT NULL DEFAULT 'percentage';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS min_order_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_uses INTEGER;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS uses_count INTEGER DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- =========================================================================
-- 5. ORDERS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  order_number TEXT,
  customer_name TEXT,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_cpf TEXT,
  customer JSONB DEFAULT '{}'::jsonb,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_fee >= 0),
  shipping_price NUMERIC(10, 2) DEFAULT 0.00,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
  coupon_code TEXT,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'Aguardando Pagamento',
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'Pendente',
  payment_details JSONB DEFAULT '{}'::jsonb,
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  shipping_carrier TEXT,
  shipping_provider TEXT,
  shipping_service TEXT,
  shipping_service_id TEXT,
  shipping_delivery_time INTEGER,
  shipping_status TEXT DEFAULT 'Aguardando preparação',
  shipping_option JSONB DEFAULT '{}'::jsonb,
  shipping_details JSONB DEFAULT '{}'::jsonb,
  tracking_code TEXT,
  tracking_url TEXT,
  shipping_label_url TEXT,
  melhor_envio_shipment_id TEXT,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  separation_started_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  in_transit_at TIMESTAMPTZ,
  out_for_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  mercado_pago_payment_id TEXT,
  mercado_pago_preference_id TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_cpf TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_price NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Aguardando Pagamento';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'Pendente';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_carrier TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_provider TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_service TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_service_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_delivery_time INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'Aguardando preparação';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_option JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_label_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS melhor_envio_shipment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS history JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS separation_started_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS in_transit_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS out_for_delivery_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mercado_pago_payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mercado_pago_preference_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- =========================================================================
-- 6. RELATIONAL ORDER ITEMS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  sku TEXT,
  variant TEXT,
  size TEXT NOT NULL DEFAULT 'M',
  color TEXT NOT NULL DEFAULT 'Padrão',
  color_name TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
  line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0),
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS size TEXT NOT NULL DEFAULT 'M';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'Padrão';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS color_name TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- =========================================================================
-- 7. USER ADDRESSES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Principal',
  recipient_name TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- =========================================================================
-- 8. CART ITEMS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.cart_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT NOT NULL DEFAULT 'M',
  color TEXT NOT NULL DEFAULT 'Padrão',
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_cart_user_product_variant UNIQUE (user_id, product_id, size, color)
);

ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS selected_size TEXT;
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS selected_color JSONB;
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- =========================================================================
-- 9. FAVORITES / WISHLIST
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_favorite UNIQUE (user_id, product_id)
);

-- =========================================================================
-- 10. RETURNS & REVERSAL REQUESTS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.returns (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'shipped', 'received')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  tracking_code TEXT,
  resolution_notes TEXT,
  refund_amount NUMERIC(10, 2) DEFAULT 0.00,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS tracking_code TEXT;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Idempotent return restock table
CREATE TABLE IF NOT EXISTS public.return_inventory_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id TEXT NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  restocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_return_restock UNIQUE (return_id, product_id)
);

-- =========================================================================
-- 11. INVENTORY MOVEMENTS (AUDIT TRAIL)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity_change INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT NOT NULL,
  order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
  return_id TEXT REFERENCES public.returns(id) ON DELETE SET NULL,
  user_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 12. ORDER STATUS HISTORY
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  source TEXT NOT NULL DEFAULT 'system',
  description TEXT,
  external_event_id TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 13. PRODUCT REVIEWS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  verified_purchase BOOLEAN DEFAULT FALSE,
  order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 14. STORE SETTINGS & APP SETTINGS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  store_name TEXT NOT NULL DEFAULT 'MARMOT CONFECÇÕES',
  contact_email TEXT NOT NULL DEFAULT 'contato@marmotconfeccoes.com.br',
  support_phone TEXT DEFAULT '(11) 99999-9999',
  whatsapp TEXT DEFAULT '(11) 99999-9999',
  instagram TEXT DEFAULT '@marmotconfeccoes',
  free_shipping_threshold NUMERIC(10, 2) NOT NULL DEFAULT 299.00 CHECK (free_shipping_threshold >= 0),
  announcement_bar_text TEXT DEFAULT 'FRETE GRÁTIS EM COMPRAS ACIMA DE R$ 299 | PARCELAMENTO EM ATÉ 12X',
  announcement_bar_active BOOLEAN DEFAULT TRUE,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  default_postal_code TEXT DEFAULT '01001-000',
  data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.store_settings (id, store_name, contact_email, free_shipping_threshold, announcement_bar_text)
VALUES (
  'default',
  'MARMOT CONFECÇÕES',
  'contato@marmotconfeccoes.com.br',
  299.00,
  'FRETE GRÁTIS EM COMPRAS ACIMA DE R$ 299 | PARCELAMENTO EM ATÉ 12X'
)
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT
);

-- =========================================================================
-- 15. SHIPPING QUOTES (SERVER-AUTHORITATIVE LOCK)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.shipping_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- =========================================================================
-- 16. STORE BANNERS & CAMPAIGNS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.store_banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image TEXT NOT NULL,
  link TEXT,
  active BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.store_banners ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE public.store_banners ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

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

-- =========================================================================
-- 17. NEWSLETTER SUBSCRIBERS
-- =========================================================================
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

ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'footer';
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

-- =========================================================================
-- 18. DURABLE EMAIL OUTBOX / LOGS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  resend_id TEXT,
  error_message TEXT,
  order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  attempt_count INTEGER DEFAULT 0,
  next_attempt_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS template TEXT;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS resend_id TEXT;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 0;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- =========================================================================
-- 19. SHIPMENT OPERATIONS & EVENTS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.shipment_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  current_step TEXT DEFAULT 'validating',
  melhor_envio_shipment_id TEXT,
  shipment_id TEXT,
  tracking_code TEXT,
  label_url TEXT,
  print_url TEXT,
  error_message TEXT,
  error TEXT,
  lock_acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.shipment_operations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'processing';
ALTER TABLE public.shipment_operations ADD COLUMN IF NOT EXISTS current_step TEXT DEFAULT 'validating';
ALTER TABLE public.shipment_operations ADD COLUMN IF NOT EXISTS melhor_envio_shipment_id TEXT;
ALTER TABLE public.shipment_operations ADD COLUMN IF NOT EXISTS shipment_id TEXT;
ALTER TABLE public.shipment_operations ADD COLUMN IF NOT EXISTS tracking_code TEXT;
ALTER TABLE public.shipment_operations ADD COLUMN IF NOT EXISTS label_url TEXT;
ALTER TABLE public.shipment_operations ADD COLUMN IF NOT EXISTS print_url TEXT;
ALTER TABLE public.shipment_operations ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.shipment_operations ADD COLUMN IF NOT EXISTS error TEXT;
ALTER TABLE public.shipment_operations ADD COLUMN IF NOT EXISTS lock_acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.shipment_operations ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.shipment_operations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.shipment_operations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.shipment_operations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tracking_code TEXT,
  carrier TEXT,
  service TEXT,
  provider_event_id TEXT,
  event_status TEXT NOT NULL,
  event_description TEXT,
  event_location TEXT,
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'melhor_envio',
  raw_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 20. WEBHOOK EVENTS (IDEMPOTENCY LEDGER)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL,
  event_key TEXT NOT NULL,
  topic TEXT DEFAULT 'payment',
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  payload JSONB DEFAULT '{}'::jsonb,
  attempt_count INTEGER DEFAULT 1,
  last_error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_webhook_event UNIQUE (gateway, event_key)
);

ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 1;
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- =========================================================================
-- 21. PAYMENT EFFECTS (FINANCIAL LEDGER)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.payment_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL DEFAULT 'mercadopago',
  payment_id TEXT NOT NULL,
  order_id TEXT UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'BRL',
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'approved',
  raw_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_payment_effects_gateway_payment UNIQUE (gateway, payment_id)
);

ALTER TABLE public.payment_effects ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL';
ALTER TABLE public.payment_effects ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.payment_effects ADD COLUMN IF NOT EXISTS raw_payload JSONB DEFAULT '{}'::jsonb;

-- =========================================================================
-- 22. ADMIN AUDIT LOGS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- INDEXES FOR HIGH-TRAFFIC RELATIONAL QUERIES
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_mp_payment ON public.orders(mercado_pago_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_me_shipment ON public.orders(melhor_envio_shipment_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product ON public.favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON public.user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_order ON public.inventory_movements(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_return ON public.inventory_movements(return_id);
CREATE INDEX IF NOT EXISTS idx_order_history_order ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON public.product_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_order ON public.returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_user ON public.returns(user_id);
CREATE INDEX IF NOT EXISTS idx_shipment_events_order ON public.shipment_events(order_id);
CREATE INDEX IF NOT EXISTS idx_shipment_ops_order ON public.shipment_operations(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_effects_order ON public.payment_effects(order_id);
CREATE INDEX IF NOT EXISTS idx_return_effects_return ON public.return_inventory_effects(return_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_shipping_quotes_user_hash ON public.shipping_quotes(user_id, cart_hash);

-- =========================================================================
-- HISTORICAL DATA BACKFILL (IDEMPOTENT)
-- =========================================================================
-- 1. Backfill relational order_items from orders.items JSONB arrays
INSERT INTO public.order_items (
  id,
  order_id,
  product_id,
  product_name,
  sku,
  size,
  color,
  quantity,
  unit_price,
  line_total,
  image,
  created_at
)
SELECT
  COALESCE(
    item->>'id',
    o.id || '-' || COALESCE(item->>'productId', item->>'product_id', item->>'id', 'item') || '-' || COALESCE(item->>'size', 'M') || '-' || COALESCE(item->>'color', item->>'colorName', 'padrao')
  ) AS id,
  o.id AS order_id,
  COALESCE(item->>'productId', item->>'product_id', item->>'id', 'unknown') AS product_id,
  COALESCE(item->>'title', item->>'product_name', item->>'name', 'Produto Marmot') AS product_name,
  item->>'sku' AS sku,
  COALESCE(item->>'size', 'M') AS size,
  COALESCE(item->>'color', item->>'colorName', 'Padrão') AS color,
  GREATEST(1, COALESCE((item->>'quantity')::integer, 1)) AS quantity,
  COALESCE((item->>'price')::numeric, (item->>'unit_price')::numeric, 0.00) AS unit_price,
  COALESCE((item->>'subtotal')::numeric, (item->>'line_total')::numeric, (COALESCE((item->>'price')::numeric, (item->>'unit_price')::numeric, 0.00) * GREATEST(1, COALESCE((item->>'quantity')::integer, 1)))) AS line_total,
  COALESCE(item->>'image', item->>'image_snapshot') AS image,
  COALESCE(o.created_at, NOW()) AS created_at
FROM public.orders o,
     jsonb_array_elements(CASE WHEN jsonb_typeof(o.items) = 'array' THEN o.items ELSE '[]'::jsonb END) AS item
WHERE o.items IS NOT NULL
  AND jsonb_typeof(o.items) = 'array'
  AND jsonb_array_length(o.items) > 0
ON CONFLICT (id) DO NOTHING;

-- 2. Backfill payment_effects ledger from paid orders
INSERT INTO public.payment_effects (
  gateway,
  payment_id,
  order_id,
  amount,
  currency,
  payment_method,
  status,
  raw_payload,
  created_at
)
SELECT
  'mercadopago' AS gateway,
  COALESCE(o.mercado_pago_payment_id, 'hist_pay_' || o.id) AS payment_id,
  o.id AS order_id,
  o.total AS amount,
  'BRL' AS currency,
  COALESCE(o.payment_method, 'Mercado Pago') AS payment_method,
  'approved' AS status,
  jsonb_build_object('order_id', o.id, 'backfilled', true, 'total', o.total) AS raw_payload,
  COALESCE(o.paid_at, o.created_at, NOW()) AS created_at
FROM public.orders o
WHERE (o.status IN ('Pagamento Aprovado', 'Em Separação', 'Pronto para Envio', 'Despachado', 'Enviado', 'Entregue') OR o.payment_status = 'Pago')
  AND NOT EXISTS (
    SELECT 1 FROM public.payment_effects pe WHERE pe.order_id = o.id
  )
ON CONFLICT (gateway, payment_id) DO NOTHING;

-- =========================================================================
-- FUNCTIONS & TRIGGERS
-- =========================================================================

-- 1. Helper function to check if the current requester is an administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );
$$;

-- 2. Trigger on new auth.users signup to create profile (Strictly 'customer' role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'customer', -- Never allow role escalation on public signup
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Trigger to prevent unauthorized role escalation on public profiles update
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role <> OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Apenas administradores autorizados podem alterar o nível de permissão de usuário.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- 4. Server-Authoritative Atomic Payment Processing & Inventory Deduction RPC
DROP FUNCTION IF EXISTS public.process_approved_order_atomic(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMPTZ, JSONB, JSONB);
DROP FUNCTION IF EXISTS public.process_approved_order_atomic(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMPTZ, JSONB);
DROP FUNCTION IF EXISTS public.process_approved_order_atomic(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.process_approved_order_atomic(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.process_approved_order_atomic(TEXT, TEXT, NUMERIC);

CREATE OR REPLACE FUNCTION public.process_approved_order_atomic(
  p_order_id TEXT,
  p_payment_id TEXT,
  p_amount NUMERIC,
  p_currency TEXT DEFAULT 'BRL',
  p_gateway TEXT DEFAULT 'mercadopago',
  p_payment_method TEXT DEFAULT 'Mercado Pago',
  p_date_approved TIMESTAMPTZ DEFAULT NOW(),
  p_items JSONB DEFAULT '[]'::jsonb,
  p_raw_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item RECORD;
  v_cur_stock INTEGER;
  v_new_stock INTEGER;
  v_effect_exists BOOLEAN;
  v_items_count INTEGER;
BEGIN
  -- 1. Check if already processed (Idempotency)
  SELECT EXISTS(
    SELECT 1 FROM public.payment_effects
    WHERE (gateway = p_gateway AND payment_id = p_payment_id)
       OR order_id = p_order_id
  ) INTO v_effect_exists;

  IF v_effect_exists THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'order_id', p_order_id,
      'message', 'Pagamento já processado anteriormente com sucesso.'
    );
  END IF;

  -- 2. Lock Order row
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido % não encontrado.', p_order_id;
  END IF;

  -- 3. Validate financial amount (Anti-tampering: exact bidirectional balance within R$ 0.05 tolerance)
  IF (p_amount < (v_order.total - 0.05) OR p_amount > (v_order.total + 0.05)) THEN
    -- Flag divergent payment
    UPDATE public.orders
    SET payment_status = 'Pagamento Divergente',
        updated_at = NOW()
    WHERE id = p_order_id;

    INSERT INTO public.order_status_history (order_id, status, source, description)
    VALUES (
      p_order_id,
      'Pagamento Divergente',
      'gateway_webhook',
      format('Valor pago (R$ %s) diverge do total do pedido (R$ %s).', p_amount, v_order.total)
    );

    RETURN jsonb_build_object(
      'success', false,
      'already_processed', false,
      'error', 'Valor de pagamento divergente do total do pedido.'
    );
  END IF;

  -- 4. Ensure order_items are present; if empty, populate from p_items or v_order.items
  SELECT COUNT(*) INTO v_items_count FROM public.order_items WHERE order_id = p_order_id;
  IF v_items_count = 0 THEN
    IF p_items IS NOT NULL AND jsonb_typeof(p_items) = 'array' AND jsonb_array_length(p_items) > 0 THEN
      INSERT INTO public.order_items (
        id, order_id, product_id, product_name, sku, size, color, quantity, unit_price, line_total, image
      )
      SELECT
        COALESCE(elem->>'id', p_order_id || '-' || COALESCE(elem->>'productId', elem->>'product_id', elem->>'id') || '-' || COALESCE(elem->>'size', 'M') || '-' || COALESCE(elem->>'color', elem->>'colorName', 'padrao')),
        p_order_id,
        COALESCE(elem->>'productId', elem->>'product_id', elem->>'id', 'unknown'),
        COALESCE(elem->>'title', elem->>'product_name', elem->>'name', 'Produto Marmot'),
        elem->>'sku',
        COALESCE(elem->>'size', 'M'),
        COALESCE(elem->>'color', elem->>'colorName', 'Padrão'),
        GREATEST(1, COALESCE((elem->>'quantity')::integer, 1)),
        COALESCE((elem->>'price')::numeric, (elem->>'unit_price')::numeric, 0.00),
        COALESCE((elem->>'subtotal')::numeric, (elem->>'line_total')::numeric, (COALESCE((elem->>'price')::numeric, (elem->>'unit_price')::numeric, 0.00) * GREATEST(1, COALESCE((elem->>'quantity')::integer, 1)))),
        COALESCE(elem->>'image', elem->>'image_snapshot')
      FROM jsonb_array_elements(p_items) AS elem
      ON CONFLICT (id) DO NOTHING;
    ELSIF v_order.items IS NOT NULL AND jsonb_typeof(v_order.items) = 'array' AND jsonb_array_length(v_order.items) > 0 THEN
      INSERT INTO public.order_items (
        id, order_id, product_id, product_name, sku, size, color, quantity, unit_price, line_total, image
      )
      SELECT
        COALESCE(elem->>'id', p_order_id || '-' || COALESCE(elem->>'productId', elem->>'product_id', elem->>'id') || '-' || COALESCE(elem->>'size', 'M') || '-' || COALESCE(elem->>'color', elem->>'colorName', 'padrao')),
        p_order_id,
        COALESCE(elem->>'productId', elem->>'product_id', elem->>'id', 'unknown'),
        COALESCE(elem->>'title', elem->>'product_name', elem->>'name', 'Produto Marmot'),
        elem->>'sku',
        COALESCE(elem->>'size', 'M'),
        COALESCE(elem->>'color', elem->>'colorName', 'Padrão'),
        GREATEST(1, COALESCE((elem->>'quantity')::integer, 1)),
        COALESCE((elem->>'price')::numeric, (elem->>'unit_price')::numeric, 0.00),
        COALESCE((elem->>'subtotal')::numeric, (elem->>'line_total')::numeric, (COALESCE((elem->>'price')::numeric, (elem->>'unit_price')::numeric, 0.00) * GREATEST(1, COALESCE((elem->>'quantity')::integer, 1)))),
        COALESCE(elem->>'image', elem->>'image_snapshot')
      FROM jsonb_array_elements(v_order.items) AS elem
      ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Recount items after insertion attempt
    SELECT COUNT(*) INTO v_items_count FROM public.order_items WHERE order_id = p_order_id;
  END IF;

  -- If still 0 items, fail closed
  IF v_items_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'already_processed', false,
      'error', 'INVALID_ORDER_ITEMS: Pedido não possui itens registrados em order_items.'
    );
  END IF;

  -- 5. Stock Pre-Check Loop (Fail-closed: Prevent overselling and zero clamping)
  FOR v_item IN
    SELECT product_id, product_name, quantity
    FROM public.order_items
    WHERE order_id = p_order_id
    ORDER BY product_id ASC
  LOOP
    SELECT stock_count INTO v_cur_stock
    FROM public.products
    WHERE id = v_item.product_id
    FOR UPDATE;

    IF FOUND AND v_cur_stock < v_item.quantity THEN
      RETURN jsonb_build_object(
        'success', false,
        'already_processed', false,
        'error', format('INSUFFICIENT_STOCK: Estoque insuficiente para o produto %s (%s disponível, %s solicitado)', COALESCE(v_item.product_name, v_item.product_id), v_cur_stock, v_item.quantity)
      );
    END IF;
  END LOOP;

  -- 6. Deduct inventory with row-level locks on products
  FOR v_item IN
    SELECT product_id, quantity
    FROM public.order_items
    WHERE order_id = p_order_id
    ORDER BY product_id ASC
  LOOP
    SELECT stock_count INTO v_cur_stock
    FROM public.products
    WHERE id = v_item.product_id
    FOR UPDATE;

    IF FOUND THEN
      v_new_stock := v_cur_stock - v_item.quantity;

      UPDATE public.products
      SET stock_count = v_new_stock,
          updated_at = NOW()
      WHERE id = v_item.product_id;

      INSERT INTO public.inventory_movements (
        product_id, quantity_change, previous_stock, new_stock, reason, order_id
      ) VALUES (
        v_item.product_id, -v_item.quantity, v_cur_stock, v_new_stock, 'Venda Aprovada', p_order_id
      );
    END IF;
  END LOOP;

  -- 7. Record Financial Ledger Effect (Single Source of Truth)
  INSERT INTO public.payment_effects (
    gateway, payment_id, order_id, amount, currency, payment_method, status, raw_payload
  ) VALUES (
    p_gateway, p_payment_id, p_order_id, p_amount, p_currency, p_payment_method, 'approved', p_raw_payload
  )
  ON CONFLICT (gateway, payment_id) DO NOTHING;

  -- 8. Update Order Status
  UPDATE public.orders
  SET status = 'Em Separação',
      payment_status = 'Pago',
      shipping_status = 'Preparando',
      paid_at = COALESCE(p_date_approved, NOW()),
      separation_started_at = COALESCE(separation_started_at, NOW()),
      mercado_pago_payment_id = p_payment_id,
      updated_at = NOW()
  WHERE id = p_order_id;

  -- 9. Add History Entry
  INSERT INTO public.order_status_history (
    order_id, status, previous_status, new_status, source, external_event_id, description
  ) VALUES (
    p_order_id,
    'Em Separação',
    'Aguardando Pagamento',
    'Em Separação',
    p_gateway,
    p_payment_id,
    format('Pagamento de R$ %s aprovado via %s. Pedido em separação.', p_amount, p_payment_method)
  );

  RETURN jsonb_build_object(
    'success', true,
    'already_processed', false,
    'order_id', p_order_id,
    'status', 'Em Separação'
  );
END;
$$;

-- 5. Webhook Idempotency Claim RPC
CREATE OR REPLACE FUNCTION public.claim_webhook_event(
  p_gateway TEXT,
  p_event_key TEXT,
  p_topic TEXT DEFAULT 'payment',
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing public.webhook_events%ROWTYPE;
BEGIN
  SELECT * INTO v_existing
  FROM public.webhook_events
  WHERE gateway = p_gateway AND event_key = p_event_key;

  IF FOUND THEN
    IF v_existing.status = 'completed' THEN
      RETURN jsonb_build_object('should_process', false, 'status', 'already_completed');
    ELSIF v_existing.status = 'processing' AND (v_existing.updated_at > NOW() - INTERVAL '3 minutes') THEN
      RETURN jsonb_build_object('should_process', false, 'status', 'currently_processing');
    ELSE
      UPDATE public.webhook_events
      SET status = 'processing',
          attempt_count = attempt_count + 1,
          updated_at = NOW()
      WHERE gateway = p_gateway AND event_key = p_event_key;

      RETURN jsonb_build_object('should_process', true, 'status', 'reclaimed');
    END IF;
  END IF;

  INSERT INTO public.webhook_events (gateway, event_key, topic, status, payload, attempt_count)
  VALUES (p_gateway, p_event_key, p_topic, 'processing', p_payload, 1);

  RETURN jsonb_build_object('should_process', true, 'status', 'claimed');
END;
$$;

-- 6. Webhook Idempotency Complete RPC
CREATE OR REPLACE FUNCTION public.complete_webhook_event(
  p_gateway TEXT,
  p_event_key TEXT,
  p_status TEXT DEFAULT 'completed',
  p_order_id TEXT DEFAULT NULL,
  p_error TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.webhook_events
  SET status = p_status,
      last_error = p_error,
      processed_at = NOW(),
      updated_at = NOW()
  WHERE gateway = p_gateway AND event_key = p_event_key;
END;
$$;

-- 7. Deduct Inventory Atomic RPC
CREATE OR REPLACE FUNCTION public.deduct_inventory_atomic(
  p_product_id TEXT,
  p_quantity INTEGER,
  p_order_id TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT 'sale'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cur_stock INTEGER;
  v_new_stock INTEGER;
BEGIN
  SELECT stock_count INTO v_cur_stock
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Produto não encontrado');
  END IF;

  IF v_cur_stock < p_quantity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Estoque insuficiente para o produto %s (%s disponível, %s solicitado)', p_product_id, v_cur_stock, p_quantity),
      'current_stock', v_cur_stock,
      'requested_quantity', p_quantity
    );
  END IF;

  v_new_stock := v_cur_stock - p_quantity;

  UPDATE public.products
  SET stock_count = v_new_stock,
      updated_at = NOW()
  WHERE id = p_product_id;

  INSERT INTO public.inventory_movements (
    product_id, quantity_change, previous_stock, new_stock, reason, order_id
  ) VALUES (
    p_product_id, -p_quantity, v_cur_stock, v_new_stock, p_reason, p_order_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'previous_stock', v_cur_stock,
    'new_stock', v_new_stock
  );
END;
$$;

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_inventory_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Products RLS
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write products" ON public.products;
CREATE POLICY "Admin write products" ON public.products FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Categories RLS
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write categories" ON public.categories;
CREATE POLICY "Admin write categories" ON public.categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Store Banners RLS
DROP POLICY IF EXISTS "Public read banners" ON public.store_banners;
CREATE POLICY "Public read banners" ON public.store_banners FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write banners" ON public.store_banners;
CREATE POLICY "Admin write banners" ON public.store_banners FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Store Settings RLS
DROP POLICY IF EXISTS "Public read store settings" ON public.store_settings;
CREATE POLICY "Public read store settings" ON public.store_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write store settings" ON public.store_settings;
CREATE POLICY "Admin write store settings" ON public.store_settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- App Settings RLS (Backend and Admin only)
DROP POLICY IF EXISTS "App settings read" ON public.app_settings;
CREATE POLICY "App settings read" ON public.app_settings FOR SELECT USING (public.is_admin() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS "App settings write" ON public.app_settings;
CREATE POLICY "App settings write" ON public.app_settings FOR ALL USING (public.is_admin() OR auth.role() = 'service_role') WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- Coupons RLS
DROP POLICY IF EXISTS "Public read active coupons" ON public.coupons;
CREATE POLICY "Public read active coupons" ON public.coupons FOR SELECT USING (active = true OR public.is_admin());
DROP POLICY IF EXISTS "Admin manage coupons" ON public.coupons;
CREATE POLICY "Admin manage coupons" ON public.coupons FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Profiles RLS
DROP POLICY IF EXISTS "Profiles select allowed for user or admin" ON public.profiles;
CREATE POLICY "Profiles select allowed for user or admin" ON public.profiles FOR SELECT USING ((select auth.uid())::text = id::text OR public.is_admin());
DROP POLICY IF EXISTS "Profiles update allowed for user or admin" ON public.profiles;
CREATE POLICY "Profiles update allowed for user or admin" ON public.profiles FOR UPDATE USING ((select auth.uid())::text = id::text OR public.is_admin()) WITH CHECK ((select auth.uid())::text = id::text OR public.is_admin());
DROP POLICY IF EXISTS "Profiles insert allowed for user or admin" ON public.profiles;
CREATE POLICY "Profiles insert allowed for user or admin" ON public.profiles FOR INSERT WITH CHECK ((select auth.uid())::text = id::text OR public.is_admin());
DROP POLICY IF EXISTS "Profiles delete only for admin" ON public.profiles;
CREATE POLICY "Profiles delete only for admin" ON public.profiles FOR DELETE USING (public.is_admin());

-- Clean up any legacy or overly permissive policies that might exist
DROP POLICY IF EXISTS "Orders insert allowed for checkout" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "Allow anonymous insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.orders;
DROP POLICY IF EXISTS "Allow anonymous read" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.orders;
DROP POLICY IF EXISTS "Allow all insert" ON public.orders;
DROP POLICY IF EXISTS "Allow all" ON public.orders;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Orders insert allowed for anyone" ON public.orders;
DROP POLICY IF EXISTS "Orders can be created by authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;

DROP POLICY IF EXISTS "Order items insert allowed for checkout" ON public.order_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.order_items;
DROP POLICY IF EXISTS "Allow anonymous insert order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.order_items;
DROP POLICY IF EXISTS "Allow anonymous read" ON public.order_items;
DROP POLICY IF EXISTS "Allow all insert" ON public.order_items;
DROP POLICY IF EXISTS "Allow all" ON public.order_items;
DROP POLICY IF EXISTS "Public insert order_items" ON public.order_items;
DROP POLICY IF EXISTS "Order items can be created by authenticated users" ON public.order_items;

DROP POLICY IF EXISTS "Returns insert allowed for customer" ON public.returns;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.returns;
DROP POLICY IF EXISTS "Allow anonymous insert returns" ON public.returns;
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.returns;
DROP POLICY IF EXISTS "Allow anonymous read" ON public.returns;
DROP POLICY IF EXISTS "Allow all insert" ON public.returns;
DROP POLICY IF EXISTS "Allow all" ON public.returns;
DROP POLICY IF EXISTS "Public insert returns" ON public.returns;

DROP POLICY IF EXISTS "Profiles allow insert" ON public.profiles;
DROP POLICY IF EXISTS "Profiles allow read" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert during registration" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all" ON public.profiles;

DROP POLICY IF EXISTS "Allow all" ON public.payment_effects;
DROP POLICY IF EXISTS "Allow all" ON public.webhook_events;
DROP POLICY IF EXISTS "Allow all" ON public.shipment_operations;
DROP POLICY IF EXISTS "Allow all" ON public.shipping_quotes;
DROP POLICY IF EXISTS "Allow all" ON public.inventory_movements;

-- Orders RLS (Strictly authoritative backend/service_role only creation, buyer/admin read)
DROP POLICY IF EXISTS "Orders select restricted to buyer and admin" ON public.orders;
CREATE POLICY "Orders select restricted to buyer and admin" ON public.orders FOR SELECT USING (
  (select auth.uid())::text = user_id::text OR 
  ((select auth.jwt()) ->> 'email' IS NOT NULL AND (select auth.jwt()) ->> 'email' = customer_email) OR 
  public.is_admin()
);
DROP POLICY IF EXISTS "Orders insert backend only" ON public.orders;
CREATE POLICY "Orders insert backend only" ON public.orders FOR INSERT WITH CHECK (
  public.is_admin() OR 
  (auth.role() = 'service_role')
);
DROP POLICY IF EXISTS "Orders update restricted to admin" ON public.orders;
CREATE POLICY "Orders update restricted to admin" ON public.orders FOR UPDATE USING (public.is_admin() OR auth.role() = 'service_role') WITH CHECK (public.is_admin() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS "Orders delete restricted to admin" ON public.orders;
CREATE POLICY "Orders delete restricted to admin" ON public.orders FOR DELETE USING (public.is_admin());

-- Order Items RLS (Strictly authoritative backend/service_role creation)
DROP POLICY IF EXISTS "Order items readable by buyer or admin" ON public.order_items;
CREATE POLICY "Order items readable by buyer or admin" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND (
      o.user_id::text = (select auth.uid())::text OR
      ((select auth.jwt()) ->> 'email' IS NOT NULL AND o.customer_email = (select auth.jwt()) ->> 'email') OR
      public.is_admin()
    )
  )
);
DROP POLICY IF EXISTS "Order items insert backend only" ON public.order_items;
CREATE POLICY "Order items insert backend only" ON public.order_items FOR INSERT WITH CHECK (
  public.is_admin() OR 
  (auth.role() = 'service_role')
);
DROP POLICY IF EXISTS "Order items admin manage" ON public.order_items;
CREATE POLICY "Order items admin manage" ON public.order_items FOR ALL USING (public.is_admin() OR auth.role() = 'service_role') WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- User Addresses RLS
DROP POLICY IF EXISTS "User addresses owner read" ON public.user_addresses;
CREATE POLICY "User addresses owner read" ON public.user_addresses FOR SELECT USING ((select auth.uid())::text = user_id::text OR public.is_admin());
DROP POLICY IF EXISTS "User addresses owner manage" ON public.user_addresses;
CREATE POLICY "User addresses owner manage" ON public.user_addresses FOR ALL USING ((select auth.uid())::text = user_id::text OR public.is_admin()) WITH CHECK ((select auth.uid())::text = user_id::text OR public.is_admin());

-- Cart Items RLS
DROP POLICY IF EXISTS "Cart items owner manage" ON public.cart_items;
CREATE POLICY "Cart items owner manage" ON public.cart_items FOR ALL USING ((select auth.uid())::text = user_id::text OR public.is_admin()) WITH CHECK ((select auth.uid())::text = user_id::text OR public.is_admin());

-- Favorites RLS
DROP POLICY IF EXISTS "Favorites owner manage" ON public.favorites;
CREATE POLICY "Favorites owner manage" ON public.favorites FOR ALL USING ((select auth.uid())::text = user_id::text OR public.is_admin()) WITH CHECK ((select auth.uid())::text = user_id::text OR public.is_admin());

-- Returns RLS
DROP POLICY IF EXISTS "Returns select allowed for owner or admin" ON public.returns;
CREATE POLICY "Returns select allowed for owner or admin" ON public.returns FOR SELECT USING (
  (select auth.uid())::text = user_id::text OR 
  ((select auth.jwt()) ->> 'email' IS NOT NULL AND (select auth.jwt()) ->> 'email' = customer_email) OR 
  public.is_admin()
);
DROP POLICY IF EXISTS "Returns insert backend only" ON public.returns;
CREATE POLICY "Returns insert backend only" ON public.returns FOR INSERT WITH CHECK (
  public.is_admin() OR 
  (auth.role() = 'service_role')
);
DROP POLICY IF EXISTS "Returns write restricted to admin" ON public.returns;
CREATE POLICY "Returns write restricted to admin" ON public.returns FOR UPDATE USING (public.is_admin() OR auth.role() = 'service_role') WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- Product Reviews RLS
DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.product_reviews;
CREATE POLICY "Reviews are publicly readable" ON public.product_reviews FOR SELECT USING (status = 'approved' OR public.is_admin() OR (select auth.uid())::text = user_id::text);
DROP POLICY IF EXISTS "Reviews insert allowed for authenticated" ON public.product_reviews;
CREATE POLICY "Reviews insert allowed for authenticated" ON public.product_reviews FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL OR public.is_admin() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS "Reviews admin manage" ON public.product_reviews;
CREATE POLICY "Reviews admin manage" ON public.product_reviews FOR ALL USING (public.is_admin() OR auth.role() = 'service_role') WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- Newsletter Subscribers RLS
DROP POLICY IF EXISTS "Newsletter insert allowed for public" ON public.newsletter_subscribers;
CREATE POLICY "Newsletter insert allowed for public" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Newsletter admin read" ON public.newsletter_subscribers;
CREATE POLICY "Newsletter admin read" ON public.newsletter_subscribers FOR SELECT USING (public.is_admin() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS "Newsletter admin manage" ON public.newsletter_subscribers;
CREATE POLICY "Newsletter admin manage" ON public.newsletter_subscribers FOR ALL USING (public.is_admin() OR auth.role() = 'service_role') WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- Shipping Quotes RLS
DROP POLICY IF EXISTS "Shipping quotes read" ON public.shipping_quotes;
CREATE POLICY "Shipping quotes read" ON public.shipping_quotes FOR SELECT USING (user_id::text = (select auth.uid())::text OR public.is_admin() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS "Shipping quotes write" ON public.shipping_quotes;
CREATE POLICY "Shipping quotes write" ON public.shipping_quotes FOR ALL USING (public.is_admin() OR auth.role() = 'service_role') WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- Ledger and Audit Tables RLS (Backend Service & Admin Only)
DROP POLICY IF EXISTS "Payment effects admin only" ON public.payment_effects;
CREATE POLICY "Payment effects admin only" ON public.payment_effects FOR ALL USING (public.is_admin() OR auth.role() = 'service_role') WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Webhook events admin only" ON public.webhook_events;
CREATE POLICY "Webhook events admin only" ON public.webhook_events FOR ALL USING (public.is_admin() OR auth.role() = 'service_role') WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Shipment operations admin only" ON public.shipment_operations;
CREATE POLICY "Shipment operations admin only" ON public.shipment_operations FOR ALL USING (public.is_admin() OR auth.role() = 'service_role') WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Shipment events buyer or admin read" ON public.shipment_events;
CREATE POLICY "Shipment events buyer or admin read" ON public.shipment_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = shipment_events.order_id
    AND (
      o.user_id::text = (select auth.uid())::text OR
      ((select auth.jwt()) ->> 'email' IS NOT NULL AND o.customer_email = (select auth.jwt()) ->> 'email') OR
      public.is_admin()
    )
  )
);
DROP POLICY IF EXISTS "Shipment events admin write" ON public.shipment_events;
CREATE POLICY "Shipment events admin write" ON public.shipment_events FOR ALL USING (public.is_admin() OR auth.role() = 'service_role') WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Order status history buyer read" ON public.order_status_history;
CREATE POLICY "Order status history buyer read" ON public.order_status_history FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_status_history.order_id
    AND (
      o.user_id::text = (select auth.uid())::text OR
      ((select auth.jwt()) ->> 'email' IS NOT NULL AND o.customer_email = (select auth.jwt()) ->> 'email') OR
      public.is_admin()
    )
  )
);
DROP POLICY IF EXISTS "Order status history admin write" ON public.order_status_history;
CREATE POLICY "Order status history admin write" ON public.order_status_history FOR ALL USING (public.is_admin() OR auth.role() = 'service_role') WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Inventory movements admin only" ON public.inventory_movements;
CREATE POLICY "Inventory movements admin only" ON public.inventory_movements FOR ALL USING (public.is_admin() OR auth.role() = 'service_role') WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Email logs admin only" ON public.email_logs;
CREATE POLICY "Email logs admin only" ON public.email_logs FOR ALL USING (public.is_admin() OR auth.role() = 'service_role') WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin audit logs admin only" ON public.admin_audit_logs;
CREATE POLICY "Admin audit logs admin only" ON public.admin_audit_logs FOR ALL USING (public.is_admin() OR auth.role() = 'service_role') WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- =========================================================================
-- STORAGE BUCKET SETUP & SECURITY POLICIES
-- =========================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

DROP POLICY IF EXISTS "Product images public read" ON storage.objects;
CREATE POLICY "Product images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Product images admin upload" ON storage.objects;
CREATE POLICY "Product images admin upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND (public.is_admin() OR auth.role() = 'service_role'));

DROP POLICY IF EXISTS "Product images admin update" ON storage.objects;
CREATE POLICY "Product images admin update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND (public.is_admin() OR auth.role() = 'service_role'))
  WITH CHECK (bucket_id = 'product-images' AND (public.is_admin() OR auth.role() = 'service_role'));

DROP POLICY IF EXISTS "Product images admin delete" ON storage.objects;
CREATE POLICY "Product images admin delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND (public.is_admin() OR auth.role() = 'service_role'));

-- =========================================================================
-- STRICT GRANTS AND EXECUTE PERMISSIONS
-- =========================================================================
-- Revoke execution from PUBLIC, anon and authenticated for sensitive financial/inventory RPCs
REVOKE EXECUTE ON FUNCTION public.process_approved_order_atomic FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_approved_order_atomic TO service_role;

REVOKE EXECUTE ON FUNCTION public.deduct_inventory_atomic FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_inventory_atomic TO service_role;

REVOKE EXECUTE ON FUNCTION public.claim_webhook_event FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_webhook_event TO service_role;

REVOKE EXECUTE ON FUNCTION public.complete_webhook_event FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_webhook_event TO service_role;

-- Revoke execution of trigger and internal functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_role FROM PUBLIC, anon, authenticated;

-- Restrict is_admin to authenticated and service_role
REVOKE EXECUTE ON FUNCTION public.is_admin FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated, service_role;
