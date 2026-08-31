-- =========================================================================
-- MIGRATION: 20260301_003_atomic_rpcs.sql
-- DESCRIPTION: RPCs atômicas com locks transacionais para pagamentos, estoque e webhooks
-- =========================================================================

-- 1. Atomic Inventory Deduction Function
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
  -- Row-level lock to prevent race conditions during concurrent checkouts
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

-- 2. Atomic Payment Approval Function
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
  v_order_status TEXT;
  v_already_processed BOOLEAN;
BEGIN
  -- 1. Check if this payment effect was already recorded (Idempotency)
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
      'message', 'Pagamento já processado anteriormente.'
    );
  END IF;

  -- 2. Register payment effect
  INSERT INTO public.payment_effects (
    order_id, gateway, payment_id, amount, currency, payment_method, status, date_approved, created_at
  ) VALUES (
    p_order_id, 'mercadopago', p_payment_id, p_amount, p_currency, p_payment_method, 'approved', p_date_approved, NOW()
  ) ON CONFLICT (gateway, payment_id) DO NOTHING;

  -- 3. Lock and update order status
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

-- 3. Distributed Webhook Claim Function
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

-- 4. Complete Webhook Event Function
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
