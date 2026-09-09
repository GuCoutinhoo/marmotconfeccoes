BEGIN;

-- Provider-neutral payment identifiers for all new checkouts. The legacy
-- provider-specific columns remain untouched so historical orders are not lost.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS payment_provider_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_provider_session_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_provider_invoice_slug TEXT,
  ADD COLUMN IF NOT EXISTS payment_installments INTEGER,
  ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_status_detail TEXT,
  ADD COLUMN IF NOT EXISTS checkout_attempt_key UUID,
  ADD COLUMN IF NOT EXISTS checkout_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS checkout_session_state TEXT,
  ADD COLUMN IF NOT EXISTS checkout_session_lease_until TIMESTAMPTZ;

-- Reconcile columns that existed under different historical bootstrap files.
-- This keeps older databases compatible without dropping their data.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code TEXT;

ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS color_name TEXT;

ALTER TABLE public.inventory_movements
  ADD COLUMN IF NOT EXISTS movement_type TEXT,
  ADD COLUMN IF NOT EXISTS quantity_change INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS variant TEXT,
  ADD COLUMN IF NOT EXISTS actor TEXT DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.inventory_movements
  DROP CONSTRAINT IF EXISTS inventory_movements_movement_type_check;
ALTER TABLE public.inventory_movements
  ADD CONSTRAINT inventory_movements_movement_type_check
  CHECK (movement_type IS NULL OR movement_type IN (
    'inflow', 'outflow', 'adjustment', 'return_restock',
    'deduction', 'addition', 'return', 'initial',
    'order_sale', 'order_cancel_restock', 'manual_adjustment', 'loss_writeoff'
  )) NOT VALID;

ALTER TABLE public.order_status_history
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS changed_by TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Preserve old financial history while moving every runtime read/write to the
-- provider-neutral columns.
UPDATE public.orders
SET payment_provider = COALESCE(payment_provider, 'mercadopago'),
    payment_provider_payment_id = COALESCE(payment_provider_payment_id, mercado_pago_payment_id),
    payment_provider_session_id = COALESCE(payment_provider_session_id, mercado_pago_preference_id)
WHERE mercado_pago_payment_id IS NOT NULL
   OR mercado_pago_preference_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_payment_provider_payment
  ON public.orders(payment_provider, payment_provider_payment_id)
  WHERE payment_provider IS NOT NULL AND payment_provider_payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_payment_provider_session
  ON public.orders(payment_provider, payment_provider_session_id)
  WHERE payment_provider IS NOT NULL AND payment_provider_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_payment_provider_invoice
  ON public.orders(payment_provider, payment_provider_invoice_slug)
  WHERE payment_provider IS NOT NULL AND payment_provider_invoice_slug IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_user_checkout_attempt
  ON public.orders(user_id, checkout_attempt_key)
  WHERE user_id IS NOT NULL AND checkout_attempt_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.refund_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  payment_provider TEXT NOT NULL,
  provider_refund_id TEXT NOT NULL,
  provider_payment_id TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
  reason TEXT,
  requested_by UUID,
  requested_by_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_provider, provider_refund_id)
);

-- Older installations already have a smaller refund_operations table. Reconcile
-- it in place instead of dropping historical refund records.
ALTER TABLE public.refund_operations
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS provider_refund_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS requested_by UUID,
  ADD COLUMN IF NOT EXISTS requested_by_email TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
DECLARE
  v_id_type TEXT;
BEGIN
  SELECT data_type INTO v_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'refund_operations' AND column_name = 'id';

  IF v_id_type = 'uuid' THEN
    EXECUTE 'ALTER TABLE public.refund_operations ALTER COLUMN id SET DEFAULT gen_random_uuid()';
  ELSE
    EXECUTE 'ALTER TABLE public.refund_operations ALTER COLUMN id SET DEFAULT gen_random_uuid()::text';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_refund_operations_provider_refund
  ON public.refund_operations(payment_provider, provider_refund_id)
  WHERE payment_provider IS NOT NULL AND provider_refund_id IS NOT NULL;

-- Serialize hosted checkout-link creation per order. This prevents two
-- concurrent browser requests from opening two payable links for one order.
DROP FUNCTION IF EXISTS public.claim_payment_session_creation(TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.claim_payment_session_creation(
  p_order_id TEXT,
  p_user_id TEXT,
  p_attempt_key UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'ORDER_NOT_FOUND');
  END IF;
  IF v_order.user_id::text IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'ORDER_OWNERSHIP_MISMATCH');
  END IF;
  IF v_order.payment_status = 'Pago' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'ORDER_ALREADY_PAID');
  END IF;
  IF v_order.checkout_url IS NOT NULL
     AND v_order.checkout_session_state = 'ready' THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'shouldCreate', FALSE,
      'status', 'checkout_exists',
      'checkoutUrl', v_order.checkout_url
    );
  END IF;
  IF v_order.checkout_session_lease_until IS NOT NULL
     AND v_order.checkout_session_lease_until > NOW() THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'shouldCreate', FALSE,
      'status', 'creation_in_progress'
    );
  END IF;

  UPDATE public.orders
  SET checkout_attempt_key = p_attempt_key,
      checkout_session_state = 'creating',
      checkout_session_lease_until = NOW() + INTERVAL '45 seconds',
      updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', TRUE, 'shouldCreate', TRUE, 'status', 'claimed');
END;
$$;

DROP FUNCTION IF EXISTS public.link_payment_session_atomic(TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.link_payment_checkout_atomic(TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.link_payment_checkout_atomic(
  p_order_id TEXT,
  p_provider TEXT,
  p_checkout_url TEXT,
  p_status_detail TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'ORDER_NOT_FOUND');
  END IF;
  IF v_order.payment_provider IS NOT NULL
     AND v_order.payment_provider <> p_provider
     AND v_order.payment_status IN ('Pago', 'Reembolsado') THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'PAYMENT_PROVIDER_MISMATCH');
  END IF;

  UPDATE public.orders
  SET payment_provider = p_provider,
      checkout_url = NULLIF(p_checkout_url, ''),
      payment_status_detail = COALESCE(NULLIF(p_status_detail, ''), payment_status_detail),
      checkout_session_state = 'ready',
      checkout_session_lease_until = NULL,
      payment_details = COALESCE(payment_details, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
        'gateway', p_provider,
        'checkoutUrl', NULLIF(p_checkout_url, ''),
        'statusDetail', NULLIF(p_status_detail, '')
      )),
      updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', TRUE, 'orderId', p_order_id, 'checkoutUrl', p_checkout_url);
END;
$$;

DROP FUNCTION IF EXISTS public.release_payment_session_creation(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.release_payment_session_creation(
  p_order_id TEXT,
  p_error TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.orders
  SET checkout_session_state = 'failed',
      checkout_session_lease_until = NULL,
      checkout_expires_at = CASE
        WHEN p_error = 'stored_session_not_open' THEN NOW()
        ELSE checkout_expires_at
      END,
      payment_status_detail = COALESCE(NULLIF(p_error, ''), payment_status_detail),
      updated_at = NOW()
  WHERE id = p_order_id AND payment_status <> 'Pago';
END;
$$;

-- Financial failures/expiry update only financial columns under a row lock;
-- they can never downgrade an already paid or refunded order.
DROP FUNCTION IF EXISTS public.update_provider_payment_state_atomic(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.update_provider_payment_state_atomic(
  p_order_id TEXT,
  p_provider TEXT,
  p_payment_status TEXT,
  p_order_status TEXT,
  p_status_detail TEXT,
  p_event_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_already_recorded BOOLEAN;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'ORDER_NOT_FOUND');
  END IF;
  IF v_order.payment_provider IS NOT NULL AND v_order.payment_provider <> p_provider THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'PAYMENT_PROVIDER_MISMATCH');
  END IF;
  IF v_order.payment_status IN ('Pago', 'Reembolsado') AND p_payment_status NOT IN ('Pago', 'Reembolsado') THEN
    RETURN jsonb_build_object('success', TRUE, 'ignored', TRUE, 'reason', 'terminal_payment_state');
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(v_order.history, '[]'::jsonb)) entry
    WHERE entry->>'externalEventId' = p_event_id
  ) INTO v_already_recorded;

  UPDATE public.orders
  SET payment_provider = p_provider,
      payment_status = p_payment_status,
      status = p_order_status,
      payment_status_detail = p_status_detail,
      payment_details = COALESCE(payment_details, '{}'::jsonb) || jsonb_build_object(
        'gateway', p_provider,
        'statusDetail', p_status_detail
      ),
      history = CASE WHEN v_already_recorded THEN history ELSE COALESCE(history, '[]'::jsonb) || jsonb_build_array(
        jsonb_build_object(
          'status', p_order_status,
          'timestamp', TO_CHAR(NOW() AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI:SS'),
          'source', p_provider,
          'externalEventId', p_event_id,
          'description', 'Status financeiro atualizado: ' || p_status_detail || '.'
        )
      ) END,
      updated_at = NOW()
  WHERE id = p_order_id;

  IF NOT v_already_recorded THEN
    INSERT INTO public.order_status_history (
      id, order_id, status, previous_status, new_status, changed_by, source,
      notes, description, metadata, created_at
    ) VALUES (
      gen_random_uuid(), p_order_id, p_order_status, v_order.status, p_order_status,
      'InfinitePay', p_provider, 'Status financeiro atualizado: ' || p_status_detail || '.',
      'Status financeiro atualizado: ' || p_status_detail || '.',
      jsonb_build_object('externalEventId', p_event_id), NOW()
    );
  END IF;

  RETURN jsonb_build_object('success', TRUE, 'ignored', FALSE, 'orderId', p_order_id);
END;
$$;

ALTER TABLE public.refund_operations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Refund operations viewable only by admin" ON public.refund_operations;
DROP POLICY IF EXISTS "Refund operations admin only" ON public.refund_operations;
DROP POLICY IF EXISTS "Refund operations restricted to service role" ON public.refund_operations;
CREATE POLICY "Refund operations restricted to service role"
  ON public.refund_operations FOR ALL TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- One transaction owns payment settlement, stock deduction, financial ledger,
-- order state, status history and removal of the purchased cart lines.
DROP FUNCTION IF EXISTS public.process_approved_order_atomic(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMPTZ, JSONB);
DROP FUNCTION IF EXISTS public.process_approved_order_atomic(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMPTZ, JSONB, JSONB);

CREATE OR REPLACE FUNCTION public.process_approved_order_atomic(
  p_order_id TEXT,
  p_payment_id TEXT,
  p_amount NUMERIC,
  p_currency TEXT DEFAULT 'BRL',
  p_gateway TEXT DEFAULT 'infinitepay',
  p_payment_method TEXT DEFAULT 'InfinitePay Checkout',
  p_date_approved TIMESTAMPTZ DEFAULT NOW(),
  p_items JSONB DEFAULT '[]'::jsonb,
  p_payment_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item RECORD;
  v_current_stock INTEGER;
  v_new_stock INTEGER;
  v_existing_effect_order TEXT;
BEGIN
  IF NULLIF(BTRIM(p_order_id), '') IS NULL OR NULLIF(BTRIM(p_payment_id), '') IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_PAYMENT_IDENTIFIERS');
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'ORDER_NOT_FOUND');
  END IF;

  IF ROUND(COALESCE(v_order.total, 0) * 100) <> ROUND(COALESCE(p_amount, 0) * 100)
     OR UPPER(COALESCE(p_currency, '')) <> 'BRL' THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'PAYMENT_AMOUNT_MISMATCH',
      'expectedAmount', v_order.total,
      'receivedAmount', p_amount,
      'receivedCurrency', p_currency
    );
  END IF;

  SELECT order_id INTO v_existing_effect_order
  FROM public.payment_effects
  WHERE gateway = p_gateway AND payment_id = p_payment_id;

  IF FOUND AND v_existing_effect_order <> p_order_id THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'PAYMENT_ALREADY_LINKED_TO_ANOTHER_ORDER'
    );
  END IF;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'alreadyProcessed', TRUE,
      'orderId', p_order_id,
      'paymentId', p_payment_id
    );
  END IF;

  IF v_order.payment_status = 'Pago' THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'ORDER_ALREADY_PAID_WITH_ANOTHER_PAYMENT'
    );
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    p_items := COALESCE(v_order.items, '[]'::jsonb);
  END IF;

  -- Aggregate repeated product rows before validating stock, then lock in a
  -- deterministic order to avoid deadlocks under concurrent webhooks.
  FOR v_item IN
    SELECT COALESCE(elem->>'productId', elem->>'id') AS product_id,
           SUM(GREATEST(1, COALESCE((elem->>'quantity')::INTEGER, 1)))::INTEGER AS quantity
    FROM jsonb_array_elements(p_items) elem
    WHERE NULLIF(COALESCE(elem->>'productId', elem->>'id'), '') IS NOT NULL
    GROUP BY COALESCE(elem->>'productId', elem->>'id')
    ORDER BY COALESCE(elem->>'productId', elem->>'id')
  LOOP
    SELECT stock_count INTO v_current_stock
    FROM public.products
    WHERE id = v_item.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', FALSE, 'error', 'PRODUCT_NOT_FOUND', 'productId', v_item.product_id);
    END IF;
    IF v_current_stock < v_item.quantity THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'INSUFFICIENT_STOCK',
        'productId', v_item.product_id,
        'currentStock', v_current_stock,
        'requestedQuantity', v_item.quantity
      );
    END IF;
  END LOOP;

  INSERT INTO public.payment_effects (
    order_id, gateway, payment_id, amount, currency, payment_method, status, date_approved, created_at
  ) VALUES (
    p_order_id, p_gateway, p_payment_id, p_amount, UPPER(p_currency), p_payment_method, 'approved', p_date_approved, NOW()
  );

  FOR v_item IN
    SELECT COALESCE(elem->>'productId', elem->>'id') AS product_id,
           SUM(GREATEST(1, COALESCE((elem->>'quantity')::INTEGER, 1)))::INTEGER AS quantity
    FROM jsonb_array_elements(p_items) elem
    WHERE NULLIF(COALESCE(elem->>'productId', elem->>'id'), '') IS NOT NULL
    GROUP BY COALESCE(elem->>'productId', elem->>'id')
    ORDER BY COALESCE(elem->>'productId', elem->>'id')
  LOOP
    SELECT stock_count INTO v_current_stock FROM public.products WHERE id = v_item.product_id FOR UPDATE;
    v_new_stock := v_current_stock - v_item.quantity;

    UPDATE public.products
    SET stock_count = v_new_stock,
        status = CASE WHEN v_new_stock <= 0 THEN 'out_of_stock' ELSE status END,
        updated_at = NOW()
    WHERE id = v_item.product_id;

    INSERT INTO public.inventory_movements (
      id, product_id, order_id, movement_type, quantity_change,
      previous_stock, new_stock, reason, actor, created_at
    ) VALUES (
      gen_random_uuid(), v_item.product_id, p_order_id, 'outflow', -v_item.quantity,
      v_current_stock, v_new_stock, 'Venda confirmada', 'infinitepay_confirmation', NOW()
    );
  END LOOP;

  UPDATE public.orders
  SET status = 'Em Separação',
      payment_status = 'Pago',
      payment_method = p_payment_method,
      payment_provider = p_gateway,
      payment_provider_payment_id = p_payment_id,
      payment_provider_session_id = COALESCE(NULLIF(p_payment_metadata->>'invoiceSlug', ''), payment_provider_session_id),
      payment_provider_invoice_slug = COALESCE(NULLIF(p_payment_metadata->>'invoiceSlug', ''), payment_provider_invoice_slug),
      payment_installments = COALESCE(NULLIF(p_payment_metadata->>'installments', '')::INTEGER, payment_installments),
      payment_amount = p_amount,
      payment_receipt_url = COALESCE(NULLIF(p_payment_metadata->>'receiptUrl', ''), payment_receipt_url),
      payment_status_detail = 'succeeded',
      payment_details = COALESCE(payment_details, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
        'gateway', p_gateway,
        'transactionId', p_payment_id,
        'invoiceSlug', NULLIF(p_payment_metadata->>'invoiceSlug', ''),
        'installments', NULLIF(p_payment_metadata->>'installments', '')::INTEGER,
        'captureMethod', NULLIF(p_payment_metadata->>'captureMethod', ''),
        'paidAmountCents', NULLIF(p_payment_metadata->>'paidAmountCents', '')::INTEGER,
        'receiptUrl', NULLIF(p_payment_metadata->>'receiptUrl', ''),
        'confirmationSource', NULLIF(p_payment_metadata->>'confirmationSource', ''),
        'statusDetail', 'paid',
        'paidAt', p_date_approved
      )),
      shipping_status = 'Aguardando compra de frete',
      paid_at = COALESCE(paid_at, p_date_approved),
      separation_started_at = COALESCE(separation_started_at, p_date_approved),
      updated_at = NOW()
  WHERE id = p_order_id;

  INSERT INTO public.order_status_history (
    id, order_id, status, previous_status, new_status, changed_by, source,
    notes, description, metadata, created_at
  ) VALUES (
    gen_random_uuid(), p_order_id, 'Em Separação', v_order.status, 'Em Separação',
    'InfinitePay', p_gateway, format('Pagamento confirmado (%s %s).', UPPER(p_currency), p_amount),
    format('Pagamento confirmado (%s %s).', UPPER(p_currency), p_amount),
    jsonb_build_object('paymentId', p_payment_id), NOW()
  );

  -- Remove only the product/variant lines that belonged to this checkout.
  DELETE FROM public.cart_items cart
  WHERE cart.user_id = v_order.user_id
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_items) elem
      WHERE cart.product_id = COALESCE(elem->>'productId', elem->>'id')
        AND cart.size IS NOT DISTINCT FROM COALESCE(NULLIF(elem->>'size', ''), cart.size)
        AND (
          cart.color IS NOT DISTINCT FROM COALESCE(NULLIF(elem->>'color', ''), NULLIF(elem->>'colorName', ''), cart.color)
          OR COALESCE(cart.color_name, cart.color) IS NOT DISTINCT FROM COALESCE(NULLIF(elem->>'colorName', ''), NULLIF(elem->>'color', ''), COALESCE(cart.color_name, cart.color))
        )
    );

  RETURN jsonb_build_object(
    'success', TRUE,
    'alreadyProcessed', FALSE,
    'orderId', p_order_id,
    'paymentId', p_payment_id,
    'status', 'Em Separação',
    'paymentStatus', 'Pago'
  );
END;
$$;

DROP FUNCTION IF EXISTS public.process_provider_refund_atomic(TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, UUID, TEXT);

CREATE OR REPLACE FUNCTION public.process_provider_refund_atomic(
  p_order_id TEXT,
  p_provider TEXT,
  p_provider_refund_id TEXT,
  p_provider_payment_id TEXT,
  p_amount NUMERIC,
  p_currency TEXT,
  p_status TEXT,
  p_reason TEXT,
  p_admin_id UUID DEFAULT NULL,
  p_admin_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_total_refunded NUMERIC(10, 2);
  v_is_full BOOLEAN;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'ORDER_NOT_FOUND');
  END IF;
  IF v_order.payment_status NOT IN ('Pago', 'Reembolsado') THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'ORDER_NOT_PAID');
  END IF;
  IF v_order.payment_provider_payment_id IS DISTINCT FROM p_provider_payment_id THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'PAYMENT_ID_MISMATCH');
  END IF;

  INSERT INTO public.refund_operations (
    order_id, payment_provider, provider_refund_id, provider_payment_id,
    amount, currency, status, reason, requested_by, requested_by_email
  ) VALUES (
    p_order_id, p_provider, p_provider_refund_id, p_provider_payment_id,
    p_amount, UPPER(p_currency), p_status, p_reason, p_admin_id, p_admin_email
  )
  ON CONFLICT (payment_provider, provider_refund_id)
    WHERE payment_provider IS NOT NULL AND provider_refund_id IS NOT NULL
  DO UPDATE
    SET status = EXCLUDED.status,
        reason = COALESCE(EXCLUDED.reason, public.refund_operations.reason),
        updated_at = NOW();

  SELECT COALESCE(SUM(amount), 0) INTO v_total_refunded
  FROM public.refund_operations
  WHERE order_id = p_order_id AND status IN ('pending', 'succeeded');

  IF v_total_refunded > v_order.total + 0.01 THEN
    RAISE EXCEPTION 'REFUND_AMOUNT_EXCEEDS_ORDER_TOTAL';
  END IF;

  v_is_full := v_total_refunded >= v_order.total - 0.01;
  UPDATE public.orders
  SET payment_status = CASE WHEN v_is_full AND p_status = 'succeeded' THEN 'Reembolsado' ELSE payment_status END,
      status = CASE WHEN v_is_full AND p_status = 'succeeded' THEN 'Reembolsado' ELSE status END,
      payment_status_detail = CASE WHEN p_status = 'failed' THEN 'refund_failed' ELSE 'refund_' || p_status END,
      payment_details = COALESCE(payment_details, '{}'::jsonb) || jsonb_build_object(
        'refundedAmount', v_total_refunded,
        'refundedAt', NOW(),
        'lastRefundId', p_provider_refund_id,
        'lastRefundStatus', p_status
      ),
      updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'alreadyProcessed', FALSE,
    'totalRefunded', v_total_refunded,
    'isFullRefund', v_is_full
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_approved_order_atomic(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMPTZ, JSONB, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_approved_order_atomic(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMPTZ, JSONB, JSONB) TO service_role;
REVOKE ALL ON FUNCTION public.process_provider_refund_atomic(TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_provider_refund_atomic(TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, UUID, TEXT) TO service_role;
REVOKE ALL ON FUNCTION public.claim_payment_session_creation(TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_payment_session_creation(TEXT, TEXT, UUID) TO service_role;
REVOKE ALL ON FUNCTION public.link_payment_checkout_atomic(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_payment_checkout_atomic(TEXT, TEXT, TEXT, TEXT) TO service_role;
REVOKE ALL ON FUNCTION public.release_payment_session_creation(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_payment_session_creation(TEXT, TEXT) TO service_role;
REVOKE ALL ON FUNCTION public.update_provider_payment_state_atomic(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_provider_payment_state_atomic(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

COMMIT;
