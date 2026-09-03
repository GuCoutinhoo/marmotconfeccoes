import pg from 'pg';

const { Client } = pg;

export const MINIMAL_FINANCIAL_SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0.00,
  stock_count INTEGER NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'Geral',
  status TEXT DEFAULT 'active',
  images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT,
  customer_email TEXT,
  total NUMERIC NOT NULL DEFAULT 0.00,
  status TEXT DEFAULT 'Pendente',
  payment_status TEXT DEFAULT 'Pendente',
  shipping_status TEXT DEFAULT 'Pendente',
  payment_method TEXT,
  shipping_address JSONB DEFAULT '{}'::jsonb,
  items JSONB DEFAULT '[]'::jsonb,
  paid_at TIMESTAMPTZ,
  separation_started_at TIMESTAMPTZ,
  mercado_pago_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT,
  sku TEXT,
  size TEXT,
  color TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0.00,
  line_total NUMERIC NOT NULL DEFAULT 0.00,
  image TEXT
);

CREATE TABLE IF NOT EXISTS public.payment_effects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gateway TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'BRL',
  payment_method TEXT,
  status TEXT DEFAULT 'approved',
  raw_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_payment_effects_gateway_payment UNIQUE (gateway, payment_id)
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  quantity_change INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT,
  order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL,
  status TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  source TEXT,
  external_event_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item RECORD;
  v_cur_stock INTEGER;
  v_new_stock INTEGER;
  v_effect_exists BOOLEAN;
  v_items_count INTEGER;
BEGIN
  -- 1. Lock Order row first (Serializes all concurrent webhooks for this order)
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido % não encontrado.', p_order_id;
  END IF;

  -- 2. Check if already processed (Idempotency inside serialized order lock)
  SELECT EXISTS(
    SELECT 1 FROM public.payment_effects
    WHERE (gateway = p_gateway AND payment_id = p_payment_id)
       OR order_id = p_order_id
  ) INTO v_effect_exists;

  IF v_effect_exists OR v_order.payment_status = 'Pago' THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'order_id', p_order_id,
      'status', v_order.status,
      'message', 'Pagamento já processado anteriormente com sucesso.'
    );
  END IF;

  -- 3. Validate financial amount (Anti-tampering: exact bidirectional balance within R$ 0.05 tolerance)
  IF (p_amount < (v_order.total - 0.05) OR p_amount > (v_order.total + 0.05)) THEN
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

  -- 4. Ensure order_items are present in database (Canonical Source of Truth)
  SELECT COUNT(*) INTO v_items_count FROM public.order_items WHERE order_id = p_order_id;
  IF v_items_count = 0 THEN
    IF v_order.items IS NOT NULL AND jsonb_typeof(v_order.items) = 'array' AND jsonb_array_length(v_order.items) > 0 THEN
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

    SELECT COUNT(*) INTO v_items_count FROM public.order_items WHERE order_id = p_order_id;
  END IF;

  IF v_items_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'already_processed', false,
      'error', 'INVALID_ORDER_ITEMS: Pedido não possui itens canônicos registrados no banco de dados.'
    );
  END IF;

  -- 5. Stock Pre-Check Loop (Fail-closed: Prevent overselling, zero clamping, and missing products)
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

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'already_processed', false,
        'error', format('INVALID_ORDER_ITEM: Produto %s não encontrado no catálogo.', COALESCE(v_item.product_name, v_item.product_id))
      );
    END IF;

    IF v_cur_stock < v_item.quantity THEN
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

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produto % não encontrado durante dedução de estoque.', v_item.product_id;
    END IF;

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
    'status', 'Em Separação',
    'payment_status', 'Pago',
    'amount', p_amount
  );
END;
$$;
`;

async function setup() {
  const dbUrl = process.env.DISPOSABLE_DATABASE_URL;
  if (!dbUrl) {
    console.log('[Setup Test DB] No DISPOSABLE_DATABASE_URL provided. Skipping local DB bootstrap.');
    return;
  }

  // Safety Gate: Reject production database URL
  if (dbUrl.includes('ktmkvysnjfphcfntazut')) {
    console.error('[Setup Test DB Error] REFUSING to run setup on production database (ktmkvysnjfphcfntazut)!');
    process.exit(1);
  }

  console.log('[Setup Test DB] Bootstrapping isolated test database from minimal financial schema (Strategy C)...');
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    await client.query(MINIMAL_FINANCIAL_SCHEMA_SQL);

    // Verify bootstrap
    const checkRes = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_name = 'process_approved_order_atomic';
    `);

    if (checkRes.rows.length === 0) {
      throw new Error('Verification failed: process_approved_order_atomic routine not found after bootstrap');
    }

    console.log('[Setup Test DB] Successfully applied minimal financial schema to disposable database!');
  } catch (err) {
    console.error('[Setup Test DB Error]:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setup();
