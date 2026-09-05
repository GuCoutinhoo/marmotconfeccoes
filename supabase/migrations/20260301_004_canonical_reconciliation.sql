-- =========================================================================
-- MIGRATION: 20260301_004_canonical_reconciliation.sql
-- DESCRIPTION: Reconciliação canônica e definitiva para o schema do Supabase.
--              Preserva todas as 116 mercadorias, categorias, cupons e configurações existentes.
--              Cria tabelas relacionais ausentes, triggers de segurança anti-escalação,
--              políticas RLS estritas e RPCs atômicas com row-level lock.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. PROFILES & ROLES SECURITY (Correção P0 de Escalação de Privilégios)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  cpf TEXT,
  phone TEXT,
  avatar_url TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garantir que as colunas essenciais existem em profiles caso a tabela já existisse
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Função segura para verificar se o usuário autenticado é admin (Strictly service_role / JWT app_metadata only)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN TRUE;
  END IF;

  RETURN COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', FALSE);
END;
$$;

-- Trigger de cadastro: NUNCA confia em raw_user_meta_data para definir role admin!
-- Todo cadastro público recebe estritamente 'customer'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    'customer', -- SEMPRE customer no signup público
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

-- Trigger para bloquear alteração de role por clientes normais
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se a coluna role estiver sendo modificada e quem chamou não for admin
  IF (NEW.role IS DISTINCT FROM OLD.role) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado: Você não possui permissão para alterar seu nível de privilégio (role).';
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- =========================================================================
-- 2. TABELAS CANÔNICAS COMPLEMENTARES
-- =========================================================================

-- Garantir que todas as colunas de orders existem (evitando 'column delivered_at not found in schema cache')
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_cpf TEXT,
  customer JSONB DEFAULT '{}'::jsonb,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  shipping_carrier TEXT,
  shipping_provider TEXT,
  shipping_service TEXT,
  shipping_service_id TEXT,
  shipping_delivery_time INTEGER,
  shipping_status TEXT DEFAULT 'Aguardando preparação',
  shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  shipping_price NUMERIC(10, 2) DEFAULT 0.00,
  shipping_option JSONB DEFAULT '{}'::jsonb,
  shipping_details JSONB,
  shipping_label_url TEXT,
  melhor_envio_shipment_id TEXT,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Aguardando Pagamento',
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'Pendente',
  payment_details JSONB DEFAULT '{}'::jsonb,
  mercado_pago_payment_id TEXT,
  mercado_pago_preference_id TEXT,
  tracking_code TEXT,
  tracking_url TEXT,
  paid_at TIMESTAMPTZ,
  separation_started_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  in_transit_at TIMESTAMPTZ,
  out_for_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  order_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_cpf TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_carrier TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_provider TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_service TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_service_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_delivery_time INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'Aguardando preparação';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_price NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_option JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_details JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_label_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS melhor_envio_shipment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Aguardando Pagamento';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'Pendente';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mercado_pago_payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mercado_pago_preference_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS separation_started_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS in_transit_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS out_for_delivery_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS history JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Tabela de Endereços de Usuário
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

-- Tabela de Itens de Pedido Relacionais
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  sku TEXT,
  variant TEXT,
  size TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  color_name TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
  line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0),
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Histórico de Status de Pedido
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'system',
  event_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabela de Carrinho Persistente
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  size TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  selected_color JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id, size, color)
);

-- Tabela de Devoluções (Returns)
CREATE TABLE IF NOT EXISTS public.returns (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  photos JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'Solicitada',
  tracking_code TEXT,
  admin_notes TEXT,
  refund_amount NUMERIC(10, 2),
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Avaliações de Produtos (Product Reviews)
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id TEXT,
  user_name TEXT NOT NULL,
  user_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  comment TEXT NOT NULL,
  verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  likes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Movimentações de Estoque (Audit Trail)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id TEXT,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('deduction', 'addition', 'adjustment', 'return', 'initial')),
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Banners da Loja
CREATE TABLE IF NOT EXISTS public.store_banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image TEXT NOT NULL,
  link TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Newsletter Subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'subscribed',
  source TEXT DEFAULT 'site',
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Logs de E-mails
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  template TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'simulated')),
  error TEXT,
  provider_message_id TEXT,
  order_id TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Idempotência e Operações de Etiqueta Melhor Envio
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

-- Tabela de Idempotência de Webhooks
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

-- Tabela de Efeitos Financeiros de Pagamento (Idempotência Financeira)
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

-- =========================================================================
-- 3. ROW LEVEL SECURITY POLICIES (Auditoria & Fechamento de Brechas)
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Profiles are readable by owner or admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be updated by owner (except role)" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be inserted by owner" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (
    (select auth.role()) = 'service_role'
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    OR ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = id)
  );

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (
    (select auth.role()) = 'service_role'
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    OR ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = id)
  )
  WITH CHECK (
    (select auth.role()) = 'service_role'
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    OR ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = id)
  );

-- Products Policies (Leitura pública, mutação estrita de admin)
DROP POLICY IF EXISTS "products_select_public" ON public.products;
CREATE POLICY "products_select_public" ON public.products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "products_admin_mutations" ON public.products;
CREATE POLICY "products_admin_mutations" ON public.products
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Orders Policies (Dono lê, inserção via backend/service_role ou dono autenticado)
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
CREATE POLICY "orders_select_policy" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
CREATE POLICY "orders_insert_policy" ON public.orders
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
CREATE POLICY "orders_update_admin" ON public.orders
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Cart Items Policies
DROP POLICY IF EXISTS "cart_items_owner_policy" ON public.cart_items;
CREATE POLICY "cart_items_owner_policy" ON public.cart_items
  FOR ALL USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Favorites Policies
DROP POLICY IF EXISTS "favorites_owner_policy" ON public.favorites;
CREATE POLICY "favorites_owner_policy" ON public.favorites
  FOR ALL USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- User Addresses Policies
DROP POLICY IF EXISTS "user_addresses_owner_policy" ON public.user_addresses;
CREATE POLICY "user_addresses_owner_policy" ON public.user_addresses
  FOR ALL USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Returns Policies
DROP POLICY IF EXISTS "returns_select_policy" ON public.returns;
CREATE POLICY "returns_select_policy" ON public.returns
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "returns_insert_policy" ON public.returns;
CREATE POLICY "returns_insert_policy" ON public.returns
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    public.is_admin()
  );

-- Product Reviews Policies (Leitura pública, criação com autenticação)
DROP POLICY IF EXISTS "reviews_select_public" ON public.product_reviews;
CREATE POLICY "reviews_select_public" ON public.product_reviews
  FOR SELECT USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "reviews_insert_authenticated" ON public.product_reviews;
CREATE POLICY "reviews_insert_authenticated" ON public.product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- =========================================================================
-- 4. RPCs ATÔMICAS COM LOCKS TRANSACIONAIS (Idempotência Financeira & Estoque)
-- =========================================================================

-- RPC de Baixa de Estoque Atômica com Row-Level Lock
CREATE OR REPLACE FUNCTION public.deduct_inventory_atomic(
  p_product_id TEXT,
  p_quantity INTEGER,
  p_order_id TEXT,
  p_reason TEXT DEFAULT 'Venda Confirmada'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_stock INTEGER;
  v_new_stock INTEGER;
BEGIN
  -- Row-level lock para prevenir race conditions durante compras concorrentes
  SELECT stock_count INTO v_current_stock
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'PROD_NOT_FOUND',
      'message', 'Produto não encontrado para baixa de estoque.'
    );
  END IF;

  IF v_current_stock < p_quantity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INSUFFICIENT_STOCK',
      'currentStock', v_current_stock,
      'requested', p_quantity,
      'message', 'Estoque insuficiente para a quantidade solicitada.'
    );
  END IF;

  v_new_stock := v_current_stock - p_quantity;

  UPDATE public.products
  SET stock_count = v_new_stock, updated_at = NOW()
  WHERE id = p_product_id;

  -- Registrar no livro razão de estoque (Audit Trail)
  INSERT INTO public.inventory_movements (
    product_id, order_id, movement_type, quantity, previous_stock, new_stock, reason, created_at
  ) VALUES (
    p_product_id, p_order_id, 'deduction', p_quantity, v_current_stock, v_new_stock, p_reason, NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'productId', p_product_id,
    'previousStock', v_current_stock,
    'newStock', v_new_stock,
    'deducted', p_quantity,
    'orderId', p_order_id
  );
END;
$$;

-- RPC de Aplicação de Pagamento Aprovado Atômica com Idempotência
CREATE OR REPLACE FUNCTION public.apply_approved_payment_atomic(
  p_order_id TEXT,
  p_payment_id TEXT,
  p_amount NUMERIC,
  p_currency TEXT DEFAULT 'BRL',
  p_payment_method TEXT DEFAULT 'Mercado Pago',
  p_date_approved TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already_processed BOOLEAN;
  v_order_status TEXT;
BEGIN
  -- 1. Verifica se esse pagamento já teve efeito financeiro aplicado
  SELECT EXISTS (
    SELECT 1 FROM public.payment_effects
    WHERE gateway = 'mercadopago' AND payment_id = p_payment_id
  ) INTO v_already_processed;

  IF v_already_processed THEN
    RETURN jsonb_build_object(
      'success', true,
      'alreadyProcessed', true,
      'orderId', p_order_id,
      'paymentId', p_payment_id,
      'message', 'Pagamento já processado anteriormente com idempotência.'
    );
  END IF;

  -- 2. Registra o efeito financeiro de pagamento de forma única
  INSERT INTO public.payment_effects (
    order_id, gateway, payment_id, amount, currency, payment_method, status, date_approved, created_at
  ) VALUES (
    p_order_id, 'mercadopago', p_payment_id, p_amount, p_currency, p_payment_method, 'approved', p_date_approved, NOW()
  ) ON CONFLICT (gateway, payment_id) DO NOTHING;

  -- 3. Atualiza o status do pedido atomicamente
  SELECT status INTO v_order_status
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF FOUND THEN
    UPDATE public.orders
    SET
      status = 'Em Separação',
      payment_status = 'Pago',
      shipping_status = 'Preparando',
      paid_at = COALESCE(paid_at, p_date_approved),
      separation_started_at = COALESCE(separation_started_at, p_date_approved),
      updated_at = NOW()
    WHERE id = p_order_id;

    -- Registrar no histórico de status do pedido
    INSERT INTO public.order_status_history (
      order_id, previous_status, new_status, source, event_id, description, timestamp
    ) VALUES (
      p_order_id, v_order_status, 'Em Separação', 'mercadopago_webhook', p_payment_id, 'Pagamento aprovado via Mercado Pago Gateway', NOW()
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'alreadyProcessed', false,
    'orderId', p_order_id,
    'paymentId', p_payment_id,
    'status', 'Em Separação'
  );
END;
$$;

-- RPC de Reivindicação de Webhook (Claim Idempotente)
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
  v_existing RECORD;
BEGIN
  SELECT id, status, order_id, processed_at
  INTO v_existing
  FROM public.webhook_events
  WHERE gateway = p_gateway AND event_key = p_event_key;

  IF FOUND THEN
    IF v_existing.status = 'completed' OR v_existing.status = 'processing' THEN
      RETURN jsonb_build_object(
        'shouldProcess', false,
        'status', v_existing.status,
        'orderId', v_existing.order_id
      );
    END IF;
  END IF;

  INSERT INTO public.webhook_events (gateway, event_key, topic, payload, status, created_at)
  VALUES (p_gateway, p_event_key, p_topic, p_payload, 'processing', NOW())
  ON CONFLICT (gateway, event_key) DO UPDATE SET
    status = 'processing',
    topic = EXCLUDED.topic,
    payload = EXCLUDED.payload;

  RETURN jsonb_build_object(
    'shouldProcess', true,
    'status', 'processing'
  );
END;
$$;

-- RPC de Conclusão de Webhook
CREATE OR REPLACE FUNCTION public.complete_webhook_event(
  p_gateway TEXT,
  p_event_key TEXT,
  p_order_id TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.webhook_events
  SET
    status = CASE WHEN p_error_message IS NOT NULL THEN 'failed' ELSE 'completed' END,
    order_id = COALESCE(p_order_id, order_id),
    error_message = p_error_message,
    processed_at = NOW()
  WHERE gateway = p_gateway AND event_key = p_event_key;
END;
$$;
