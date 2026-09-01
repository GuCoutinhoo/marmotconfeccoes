-- =========================================================================
-- COMPLETE PRODUCTION MIGRATION FOR MARMOT CONFECÇÕES
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (Customers and Administrators)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  cpf TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Products Catalog
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  subtitle TEXT,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  promo_price NUMERIC(10, 2) CHECK (promo_price IS NULL OR promo_price >= 0),
  category TEXT NOT NULL DEFAULT 'camisetas',
  subcategory TEXT,
  collection TEXT DEFAULT 'Vol. 04: Cyber Dystopia',
  tags TEXT[] DEFAULT '{}',
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (rating >= 1.0 AND rating <= 5.0),
  review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  stock_count INTEGER NOT NULL DEFAULT 0 CHECK (stock_count >= 0),
  sku TEXT,
  sizes TEXT[] DEFAULT '{}',
  colors JSONB DEFAULT '[]'::jsonb,
  image TEXT,
  images TEXT[] DEFAULT '{}',
  details TEXT,
  care_instructions TEXT,
  composition TEXT,
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

-- 3. Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  image TEXT,
  subcategories TEXT[] DEFAULT '{}',
  product_count INTEGER DEFAULT 0,
  "order" INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Coupons
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

-- 5. Orders Table
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
  shipping_details JSONB,
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

-- 6. Relational Order Items
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
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Order Status History
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL DEFAULT 'system',
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. User Addresses
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
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
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Cart Items
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT NOT NULL DEFAULT 'M',
  color TEXT NOT NULL DEFAULT 'Padrão',
  color_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id, size, color)
);

-- 10. Favorites / Wishlist
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 11. Returns
CREATE TABLE IF NOT EXISTS public.returns (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  user_id TEXT,
  customer_name TEXT,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'Solicitado' CHECK (status IN ('Solicitado', 'Em Análise', 'Aprovado', 'Recusado', 'Concluído')),
  return_shipping_code TEXT,
  refund_amount NUMERIC(10, 2) DEFAULT 0.00,
  refund_status TEXT DEFAULT 'Pendente',
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  admin_notes TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Inventory Movements Ledger
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
  return_id TEXT REFERENCES public.returns(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('inflow', 'outflow', 'adjustment', 'return_restock')),
  quantity_change INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT NOT NULL,
  variant TEXT,
  actor TEXT NOT NULL DEFAULT 'system',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Product Reviews
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id TEXT,
  order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  likes INTEGER DEFAULT 0,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Store Settings
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY,
  store_name TEXT NOT NULL DEFAULT 'Marmot Confecções',
  contact_email TEXT DEFAULT 'contato@marmotconfeccoes.com.br',
  support_phone TEXT DEFAULT '(11) 99999-9999',
  free_shipping_threshold NUMERIC(10, 2) NOT NULL DEFAULT 399.00 CHECK (free_shipping_threshold >= 0),
  banner_alert TEXT,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Store Banners
CREATE TABLE IF NOT EXISTS public.store_banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  button_text TEXT,
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  placement TEXT DEFAULT 'home_hero',
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Newsletter Subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  source TEXT DEFAULT 'footer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Email Logs / Outbox
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  resend_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Shipment Operations (Distributed Locks & Idempotency for Mejor Envio)
CREATE TABLE IF NOT EXISTS public.shipment_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('processing', 'cart_created', 'checkout_completed', 'label_generated', 'completed', 'failed')),
  melhor_envio_shipment_id TEXT,
  tracking_code TEXT,
  label_url TEXT,
  error_message TEXT,
  lock_acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Shipment Events
CREATE TABLE IF NOT EXISTS public.shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tracking_code TEXT,
  carrier TEXT,
  service TEXT,
  event_status TEXT NOT NULL,
  event_description TEXT,
  event_location TEXT,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'webhook',
  raw_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. Webhook Events (Idempotency and Claim Table)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL,
  event_key TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT 'payment',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  order_id TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  last_error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(gateway, event_key)
);

-- 21. Payment Effects (Ledger of Approved / Processed Financial Transactions)
CREATE TABLE IF NOT EXISTS public.payment_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL DEFAULT 'mercadopago',
  payment_id TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  payment_method TEXT NOT NULL DEFAULT 'Mercado Pago',
  status TEXT NOT NULL DEFAULT 'approved',
  date_approved TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(gateway, payment_id)
);

-- 22. Admin Audit Logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  changes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- FUNCTIONS & TRIGGERS
-- =========================================================================

-- Helper function to check if caller is an administrator (Resiliente a UUID e TEXT)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  RETURN (
    COALESCE(auth.jwt() ->> 'role', '') = 'admin' OR
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin' OR
    COALESCE(auth.jwt() ->> 'email', '') IN ('admin@marmot.com', 'admin@marmot.com.br', 'gustavohcsantos.mm2020@gmail.com') OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role, anon;

-- Secure trigger for new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  assigned_role TEXT := 'customer';
BEGIN
  IF LOWER(NEW.email) IN ('admin@marmot.com', 'admin@marmot.com.br', 'gustavohcsantos.mm2020@gmail.com') THEN
    assigned_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    assigned_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    role = CASE WHEN profiles.role = 'admin' THEN 'admin' ELSE EXCLUDED.role END,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to protect profiles.role
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT (public.is_admin() OR auth.role() = 'service_role' OR current_user = 'postgres') THEN
      NEW.role := OLD.role;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- Complete Atomic Payment Approval & Stock Deduction Transaction
CREATE OR REPLACE FUNCTION public.process_approved_order_atomic(
  p_order_id TEXT,
  p_payment_id TEXT,
  p_amount NUMERIC,
  p_currency TEXT DEFAULT 'BRL',
  p_gateway TEXT DEFAULT 'mercadopago',
  p_payment_method TEXT DEFAULT 'Mercado Pago',
  p_date_approved TIMESTAMPTZ DEFAULT NOW(),
  p_items JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_already_processed BOOLEAN;
  v_order RECORD;
  v_item JSONB;
  v_prod_id TEXT;
  v_qty INTEGER;
  v_cur_stock INTEGER;
  v_new_stock INTEGER;
  v_prod_ids TEXT[];
BEGIN
  -- 1. Check idempotency against payment_effects
  SELECT EXISTS (
    SELECT 1 FROM public.payment_effects
    WHERE gateway = p_gateway AND payment_id = p_payment_id
  ) INTO v_already_processed;

  IF v_already_processed THEN
    RETURN jsonb_build_object(
      'success', true,
      'alreadyProcessed', true,
      'orderId', p_order_id,
      'paymentId', p_payment_id,
      'message', 'Pagamento já processado anteriormente com sucesso.'
    );
  END IF;

  -- 2. Lock and retrieve order
  SELECT id, status, payment_status, total, user_id, items
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ORDER_NOT_FOUND',
      'message', 'Pedido não encontrado no banco de dados.'
    );
  END IF;

  -- 3. Items fallback
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    p_items := COALESCE(v_order.items, '[]'::jsonb);
  END IF;

  -- 4. Gather and sort product IDs
  SELECT ARRAY_AGG(DISTINCT (elem->>'productId')::TEXT ORDER BY (elem->>'productId')::TEXT ASC)
  INTO v_prod_ids
  FROM jsonb_array_elements(p_items) AS elem
  WHERE elem->>'productId' IS NOT NULL AND elem->>'productId' != '';

  -- 5. Lock product rows
  IF v_prod_ids IS NOT NULL AND array_length(v_prod_ids, 1) > 0 THEN
    PERFORM id, stock_count
    FROM public.products
    WHERE id = ANY(v_prod_ids)
    ORDER BY id ASC
    FOR UPDATE;
  END IF;

  -- 6. Validate stock
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      v_prod_id := COALESCE(v_item->>'productId', v_item->>'id');
      v_qty := GREATEST(1, COALESCE((v_item->>'quantity')::INTEGER, 1));
      
      IF v_prod_id IS NOT NULL AND v_prod_id != '' THEN
        SELECT stock_count INTO v_cur_stock
        FROM public.products
        WHERE id = v_prod_id;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'PRODUCT_NOT_FOUND: %', v_prod_id;
        END IF;

        IF v_cur_stock < v_qty THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', 'INSUFFICIENT_STOCK',
            'productId', v_prod_id,
            'currentStock', v_cur_stock,
            'requestedQuantity', v_qty,
            'message', format('Estoque insuficiente para o produto %s: disponível %s, solicitado %s.', v_prod_id, v_cur_stock, v_qty)
          );
        END IF;
      END IF;
    END LOOP;

    -- 7. Deduct stock & write movements
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      v_prod_id := COALESCE(v_item->>'productId', v_item->>'id');
      v_qty := GREATEST(1, COALESCE((v_item->>'quantity')::INTEGER, 1));

      IF v_prod_id IS NOT NULL AND v_prod_id != '' THEN
        SELECT stock_count INTO v_cur_stock
        FROM public.products
        WHERE id = v_prod_id;

        v_new_stock := GREATEST(0, v_cur_stock - v_qty);

        UPDATE public.products
        SET stock_count = v_new_stock, updated_at = NOW()
        WHERE id = v_prod_id;

        INSERT INTO public.inventory_movements (
          id, product_id, order_id, movement_type, quantity_change, previous_stock, new_stock, reason, variant, actor, created_at
        ) VALUES (
          gen_random_uuid(),
          v_prod_id,
          p_order_id,
          'outflow',
          -v_qty,
          v_cur_stock,
          v_new_stock,
          'Venda Confirmada (Mercado Pago)',
          COALESCE(v_item->>'size', '') || ' / ' || COALESCE(v_item->>'color', ''),
          'mercadopago_webhook',
          NOW()
        );
      END IF;
    END LOOP;
  END IF;

  -- 8. Record payment effect
  INSERT INTO public.payment_effects (
    order_id, gateway, payment_id, amount, currency, payment_method, status, date_approved, created_at
  ) VALUES (
    p_order_id, p_gateway, p_payment_id, p_amount, p_currency, p_payment_method, 'approved', p_date_approved, NOW()
  ) ON CONFLICT (gateway, payment_id) DO NOTHING;

  -- 9. Update order
  UPDATE public.orders
  SET
    status = 'Em Separação',
    payment_status = 'Pago',
    shipping_status = 'Aguardando preparação',
    paid_at = COALESCE(paid_at, p_date_approved),
    separation_started_at = COALESCE(separation_started_at, p_date_approved),
    mercado_pago_payment_id = p_payment_id,
    updated_at = NOW()
  WHERE id = p_order_id;

  -- 10. Record status transition history
  INSERT INTO public.order_status_history (
    id, order_id, previous_status, new_status, changed_by, notes, created_at
  ) VALUES (
    gen_random_uuid(),
    p_order_id,
    v_order.status,
    'Em Separação',
    'Mercado Pago Webhook',
    format('Pagamento aprovado ID %s (%s %s)', p_payment_id, p_currency, p_amount),
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'alreadyProcessed', false,
    'orderId', p_order_id,
    'paymentId', p_payment_id,
    'status', 'Em Separação',
    'paymentStatus', 'Pago'
  );
END;
$$;

-- Atomic Webhook Claim Function
CREATE OR REPLACE FUNCTION public.claim_webhook_event(
  p_gateway TEXT,
  p_event_key TEXT,
  p_topic TEXT DEFAULT 'payment',
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_row public.webhook_events%ROWTYPE;
BEGIN
  INSERT INTO public.webhook_events (
    id, gateway, event_key, topic, payload, status, attempt_count, received_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_gateway, p_event_key, p_topic, p_payload, 'processing', 1, NOW(), NOW()
  )
  ON CONFLICT (gateway, event_key) DO UPDATE
    SET attempt_count = public.webhook_events.attempt_count + 1,
        updated_at = NOW()
    WHERE public.webhook_events.status = 'failed'
  RETURNING * INTO v_row;

  IF FOUND AND v_row.status = 'processing' THEN
    RETURN jsonb_build_object(
      'shouldProcess', true,
      'status', 'processing',
      'id', v_row.id,
      'eventKey', p_event_key
    );
  ELSE
    SELECT * INTO v_row FROM public.webhook_events WHERE gateway = p_gateway AND event_key = p_event_key;
    RETURN jsonb_build_object(
      'shouldProcess', false,
      'status', v_row.status,
      'orderId', v_row.order_id,
      'eventKey', p_event_key
    );
  END IF;
END;
$$;

-- Complete Webhook Event
CREATE OR REPLACE FUNCTION public.complete_webhook_event(
  p_gateway TEXT,
  p_event_key TEXT,
  p_status TEXT,
  p_order_id TEXT DEFAULT NULL,
  p_error TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  UPDATE public.webhook_events
  SET
    status = p_status,
    order_id = COALESCE(p_order_id, order_id),
    last_error = p_error,
    processed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE processed_at END,
    updated_at = NOW()
  WHERE gateway = p_gateway AND event_key = p_event_key;
END;
$$;

-- Atomic Single Item Inventory Deduction
CREATE OR REPLACE FUNCTION public.deduct_inventory_atomic(
  p_product_id TEXT,
  p_quantity INTEGER,
  p_order_id TEXT,
  p_reason TEXT DEFAULT 'Venda Confirmada'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_current_stock INTEGER;
  v_new_stock INTEGER;
BEGIN
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

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles read restricted to owner and admin" ON public.profiles;
CREATE POLICY "Profiles read restricted to owner and admin"
  ON public.profiles FOR SELECT
  USING (auth.uid()::text = id::text OR public.is_admin());

DROP POLICY IF EXISTS "Profiles update restricted to owner and admin" ON public.profiles;
CREATE POLICY "Profiles update restricted to owner and admin"
  ON public.profiles FOR UPDATE
  USING (auth.uid()::text = id::text OR public.is_admin())
  WITH CHECK (auth.uid()::text = id::text OR public.is_admin());

DROP POLICY IF EXISTS "Profiles insert allowed for user or admin" ON public.profiles;
CREATE POLICY "Profiles insert allowed for user or admin"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid()::text = id::text OR public.is_admin() OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Profiles delete only for admin" ON public.profiles;
CREATE POLICY "Profiles delete only for admin"
  ON public.profiles FOR DELETE
  USING (public.is_admin());

-- Products RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products are publicly readable" ON public.products;
CREATE POLICY "Products are publicly readable"
  ON public.products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Products write restricted to admin" ON public.products;
CREATE POLICY "Products write restricted to admin"
  ON public.products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Categories RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories are publicly readable" ON public.categories;
CREATE POLICY "Categories are publicly readable"
  ON public.categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Categories write restricted to admin" ON public.categories;
CREATE POLICY "Categories write restricted to admin"
  ON public.categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Coupons RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Coupons are viewable by everyone" ON public.coupons;
CREATE POLICY "Coupons are viewable by everyone"
  ON public.coupons FOR SELECT
  USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "Coupons write restricted to admin" ON public.coupons;
CREATE POLICY "Coupons write restricted to admin"
  ON public.coupons FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Orders RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Orders select restricted to buyer and admin" ON public.orders;
CREATE POLICY "Orders select restricted to buyer and admin"
  ON public.orders FOR SELECT
  USING (
    auth.uid()::text = user_id::text OR 
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

-- Order Items RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Order items readable by buyer or admin" ON public.order_items;
CREATE POLICY "Order items readable by buyer or admin"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND (
        o.user_id::text = auth.uid()::text OR
        (auth.jwt() ->> 'email' IS NOT NULL AND o.customer_email = auth.jwt() ->> 'email') OR
        public.is_admin()
      )
    )
  );

DROP POLICY IF EXISTS "Order items insert allowed" ON public.order_items;
CREATE POLICY "Order items insert allowed"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

-- User Addresses RLS
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User addresses owner read" ON public.user_addresses;
CREATE POLICY "User addresses owner read"
  ON public.user_addresses FOR SELECT
  USING (auth.uid()::text = user_id::text OR public.is_admin());

DROP POLICY IF EXISTS "User addresses owner manage" ON public.user_addresses;
CREATE POLICY "User addresses owner manage"
  ON public.user_addresses FOR ALL
  USING (auth.uid()::text = user_id::text OR public.is_admin())
  WITH CHECK (auth.uid()::text = user_id::text OR public.is_admin());

-- Cart Items RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cart items owner manage" ON public.cart_items;
CREATE POLICY "Cart items owner manage"
  ON public.cart_items FOR ALL
  USING (auth.uid()::text = user_id::text OR public.is_admin())
  WITH CHECK (auth.uid()::text = user_id::text OR public.is_admin());

-- Favorites RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Favorites owner manage" ON public.favorites;
CREATE POLICY "Favorites owner manage"
  ON public.favorites FOR ALL
  USING (auth.uid()::text = user_id::text OR public.is_admin())
  WITH CHECK (auth.uid()::text = user_id::text OR public.is_admin());

-- Returns RLS
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Returns select allowed for owner or admin" ON public.returns;
CREATE POLICY "Returns select allowed for owner or admin"
  ON public.returns FOR SELECT
  USING (
    auth.uid()::text = user_id::text OR 
    (auth.jwt() ->> 'email' IS NOT NULL AND auth.jwt() ->> 'email' = customer_email) OR 
    public.is_admin()
  );

DROP POLICY IF EXISTS "Returns insert allowed" ON public.returns;
CREATE POLICY "Returns insert allowed"
  ON public.returns FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Returns write restricted to admin" ON public.returns;
CREATE POLICY "Returns write restricted to admin"
  ON public.returns FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Product Reviews RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.product_reviews;
CREATE POLICY "Reviews are publicly readable"
  ON public.product_reviews FOR SELECT
  USING (status = 'approved' OR public.is_admin() OR auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Reviews insert allowed" ON public.product_reviews;
CREATE POLICY "Reviews insert allowed"
  ON public.product_reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL OR public.is_admin());

DROP POLICY IF EXISTS "Reviews admin manage" ON public.product_reviews;
CREATE POLICY "Reviews admin manage"
  ON public.product_reviews FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Store Settings & Banners RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Settings public read" ON public.store_settings;
CREATE POLICY "Settings public read" ON public.store_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Settings admin write" ON public.store_settings;
CREATE POLICY "Settings admin write" ON public.store_settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.store_banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Banners public read" ON public.store_banners;
CREATE POLICY "Banners public read" ON public.store_banners FOR SELECT USING (true);
DROP POLICY IF EXISTS "Banners admin write" ON public.store_banners;
CREATE POLICY "Banners admin write" ON public.store_banners FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Newsletter Subscribers RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Newsletter insert allowed" ON public.newsletter_subscribers;
CREATE POLICY "Newsletter insert allowed" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Newsletter admin manage" ON public.newsletter_subscribers;
CREATE POLICY "Newsletter admin manage" ON public.newsletter_subscribers FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Inventory Movements RLS
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inventory movements admin read" ON public.inventory_movements;
CREATE POLICY "Inventory movements admin read" ON public.inventory_movements FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Inventory movements admin write" ON public.inventory_movements;
CREATE POLICY "Inventory movements admin write" ON public.inventory_movements FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Order Status History RLS
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Order status history select allowed" ON public.order_status_history;
CREATE POLICY "Order status history select allowed" ON public.order_status_history FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_status_history.order_id
    AND (
      o.user_id::text = auth.uid()::text OR
      (auth.jwt() ->> 'email' IS NOT NULL AND o.customer_email = auth.jwt() ->> 'email') OR
      public.is_admin()
    )
  )
);
DROP POLICY IF EXISTS "Order status history admin write" ON public.order_status_history;
CREATE POLICY "Order status history admin write" ON public.order_status_history FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Backend & Service Tables RLS (Admin / Service Role only)
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Email logs admin only" ON public.email_logs;
CREATE POLICY "Email logs admin only" ON public.email_logs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.shipment_operations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Shipment operations admin only" ON public.shipment_operations;
CREATE POLICY "Shipment operations admin only" ON public.shipment_operations FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Shipment events select allowed" ON public.shipment_events;
CREATE POLICY "Shipment events select allowed" ON public.shipment_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = shipment_events.order_id
    AND (
      o.user_id::text = auth.uid()::text OR
      (auth.jwt() ->> 'email' IS NOT NULL AND o.customer_email = auth.jwt() ->> 'email') OR
      public.is_admin()
    )
  )
);
DROP POLICY IF EXISTS "Shipment events admin write" ON public.shipment_events;
CREATE POLICY "Shipment events admin write" ON public.shipment_events FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Webhook events admin only" ON public.webhook_events;
CREATE POLICY "Webhook events admin only" ON public.webhook_events FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.payment_effects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Payment effects admin only" ON public.payment_effects;
CREATE POLICY "Payment effects admin only" ON public.payment_effects FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Audit logs admin only" ON public.admin_audit_logs;
CREATE POLICY "Audit logs admin only" ON public.admin_audit_logs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Permissions Grants
REVOKE EXECUTE ON FUNCTION public.process_approved_order_atomic FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_approved_order_atomic TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.deduct_inventory_atomic FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deduct_inventory_atomic TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.claim_webhook_event FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_webhook_event TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.complete_webhook_event FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_webhook_event TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.is_admin TO PUBLIC, anon, authenticated, service_role;
