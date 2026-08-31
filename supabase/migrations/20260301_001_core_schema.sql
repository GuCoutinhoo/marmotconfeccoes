-- =========================================================================
-- MIGRATION: 20260301_001_core_schema.sql
-- DESCRIPTION: Tabelas e colunas fundamentais do e-commerce Marmot Confecções
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Clientes e Administradores)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  cpf TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Products Table (Catálogo com suporte a peso e dimensões para frete)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Orders Table (Pedidos com colunas de rastreio, pagamento e ciclo de vida)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_cpf TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_fee >= 0),
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
  total NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'Aguardando Pagamento',
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'Pendente',
  payment_details JSONB DEFAULT '{}'::jsonb,
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  shipping_carrier TEXT,
  shipping_service TEXT,
  shipping_service_id TEXT,
  shipping_status TEXT DEFAULT 'Pendente',
  tracking_code TEXT,
  shipping_label_url TEXT,
  melhor_envio_shipment_id TEXT,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  separation_started_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  in_transit_at TIMESTAMPTZ,
  out_for_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- 4. User Addresses Table
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  cpf TEXT,
  phone TEXT,
  cep TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Cart Items Table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  size TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id, size, color)
);

-- 6. Wishlist Items Table
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 7. Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  code TEXT PRIMARY KEY,
  discount_percentage INTEGER NOT NULL DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  discount_amount NUMERIC(10, 2) DEFAULT 0.00 CHECK (discount_amount >= 0),
  min_order_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (min_order_value >= 0),
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. App Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Webhook Events Table (Controle de Idempotência)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL,
  event_key TEXT NOT NULL,
  topic TEXT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  order_id TEXT,
  payload JSONB,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(gateway, event_key)
);

-- 10. Payment Effects Table (Controle Financeiro de Pagamentos)
CREATE TABLE IF NOT EXISTS public.payment_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL DEFAULT 'mercadopago',
  payment_id TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'approved',
  date_approved TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(gateway, payment_id)
);

-- 11. Shipment Operations Table (Controle de Geração de Etiquetas)
CREATE TABLE IF NOT EXISTS public.shipment_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  current_step TEXT NOT NULL DEFAULT 'initiated',
  shipment_id TEXT,
  tracking_code TEXT,
  print_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Admin Audit Logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  admin_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
