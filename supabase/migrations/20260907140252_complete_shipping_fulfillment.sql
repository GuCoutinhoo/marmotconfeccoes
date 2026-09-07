BEGIN;

-- Keep payment settlement, freight purchase and label generation as distinct,
-- queryable states. The existing shipping_status column remains the delivery
-- lifecycle shown to customers.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_quote_id TEXT,
  ADD COLUMN IF NOT EXISTS shipment_purchase_status TEXT NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS label_generation_status TEXT NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS shipment_purchased_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS label_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shipment_last_error TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_shipping_quote_id_fkey'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_shipping_quote_id_fkey
      FOREIGN KEY (shipping_quote_id)
      REFERENCES public.shipping_quotes(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_shipment_purchase_status_check'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_shipment_purchase_status_check
      CHECK (shipment_purchase_status IN ('not_started', 'processing', 'purchased', 'failed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_label_generation_status_check'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_label_generation_status_check
      CHECK (label_generation_status IN ('not_started', 'processing', 'generated', 'failed'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_orders_shipping_quote_id
  ON public.orders(shipping_quote_id);
CREATE INDEX IF NOT EXISTS idx_orders_shipment_purchase_status
  ON public.orders(shipment_purchase_status);

-- Preserve the real Melhor Envio response used to bind checkout and
-- fulfilment to the exact carrier/service selected by the customer.
ALTER TABLE public.shipping_quotes
  ADD COLUMN IF NOT EXISTS origin_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS company_id INTEGER,
  ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS environment TEXT,
  ADD COLUMN IF NOT EXISTS raw_quote JSONB NOT NULL DEFAULT '{}'::jsonb;

-- A lease token prevents two serverless instances from buying the same
-- shipment concurrently. shipment_operations already has UNIQUE(order_id).
ALTER TABLE public.shipment_operations
  ADD COLUMN IF NOT EXISTS lock_token UUID,
  ADD COLUMN IF NOT EXISTS lock_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS label_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_reconciled_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.claim_shipment_operation(
  p_order_id TEXT,
  p_lock_timeout_seconds INTEGER DEFAULT 300
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_operation public.shipment_operations%ROWTYPE;
  v_lock_token UUID := gen_random_uuid();
  v_lock_timeout INTERVAL := make_interval(secs => GREATEST(60, LEAST(p_lock_timeout_seconds, 900)));
BEGIN
  IF NULLIF(BTRIM(p_order_id), '') IS NULL THEN
    RAISE EXCEPTION 'order_id is required';
  END IF;

  INSERT INTO public.shipment_operations (
    order_id,
    status,
    current_step,
    lock_token,
    lock_acquired_at,
    lock_expires_at,
    attempt_count,
    updated_at
  ) VALUES (
    p_order_id,
    'processing',
    'validating',
    v_lock_token,
    NOW(),
    NOW() + v_lock_timeout,
    1,
    NOW()
  )
  ON CONFLICT (order_id) DO NOTHING
  RETURNING * INTO v_operation;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'should_process', TRUE,
      'is_locked', FALSE,
      'lock_token', v_lock_token,
      'operation', to_jsonb(v_operation)
    );
  END IF;

  SELECT * INTO v_operation
  FROM public.shipment_operations
  WHERE order_id = p_order_id
  FOR UPDATE;

  IF v_operation.status = 'completed' THEN
    RETURN jsonb_build_object(
      'should_process', FALSE,
      'is_locked', FALSE,
      'operation', to_jsonb(v_operation)
    );
  END IF;

  IF v_operation.status = 'processing'
     AND COALESCE(v_operation.lock_expires_at, v_operation.updated_at + v_lock_timeout) > NOW() THEN
    RETURN jsonb_build_object(
      'should_process', FALSE,
      'is_locked', TRUE,
      'operation', to_jsonb(v_operation)
    );
  END IF;

  UPDATE public.shipment_operations
  SET status = 'processing',
      current_step = CASE
        WHEN COALESCE(shipment_id, melhor_envio_shipment_id) IS NULL THEN 'validating'
        ELSE COALESCE(current_step, 'cart_created')
      END,
      lock_token = v_lock_token,
      lock_acquired_at = NOW(),
      lock_expires_at = NOW() + v_lock_timeout,
      attempt_count = COALESCE(attempt_count, 0) + 1,
      error = NULL,
      error_message = NULL,
      updated_at = NOW()
  WHERE order_id = p_order_id
  RETURNING * INTO v_operation;

  RETURN jsonb_build_object(
    'should_process', TRUE,
    'is_locked', FALSE,
    'lock_token', v_lock_token,
    'operation', to_jsonb(v_operation)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_shipment_operation(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_shipment_operation(TEXT, INTEGER) TO service_role;

-- Webhook notifications use their own notification id as event_key. This
-- function remains safe when two serverless instances receive the same event
-- at the same time, and permits retrying failed/stale events.
CREATE OR REPLACE FUNCTION public.claim_webhook_event(
  p_gateway TEXT,
  p_event_key TEXT,
  p_topic TEXT DEFAULT 'payment',
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event public.webhook_events%ROWTYPE;
BEGIN
  INSERT INTO public.webhook_events (gateway, event_key, topic, payload, status, attempt_count, received_at, updated_at)
  VALUES (p_gateway, p_event_key, p_topic, p_payload, 'processing', 1, NOW(), NOW())
  ON CONFLICT (gateway, event_key) DO NOTHING
  RETURNING * INTO v_event;

  IF FOUND THEN
    RETURN jsonb_build_object('should_process', TRUE, 'status', 'claimed');
  END IF;

  SELECT * INTO v_event
  FROM public.webhook_events
  WHERE gateway = p_gateway AND event_key = p_event_key
  FOR UPDATE;

  IF v_event.status = 'completed' THEN
    RETURN jsonb_build_object('should_process', FALSE, 'status', 'already_completed');
  END IF;

  IF v_event.status = 'processing' AND v_event.updated_at > NOW() - INTERVAL '3 minutes' THEN
    RETURN jsonb_build_object('should_process', FALSE, 'status', 'currently_processing');
  END IF;

  UPDATE public.webhook_events
  SET status = 'processing',
      topic = p_topic,
      payload = p_payload,
      attempt_count = attempt_count + 1,
      last_error = NULL,
      updated_at = NOW()
  WHERE gateway = p_gateway AND event_key = p_event_key;

  RETURN jsonb_build_object('should_process', TRUE, 'status', 'reclaimed');
END;
$$;

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
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.webhook_events
  SET status = p_status,
      order_id = COALESCE(p_order_id, order_id),
      last_error = p_error,
      processed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE processed_at END,
      updated_at = NOW()
  WHERE gateway = p_gateway AND event_key = p_event_key;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_webhook_event(TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_webhook_event(TEXT, TEXT, TEXT, JSONB) TO service_role;
REVOKE ALL ON FUNCTION public.complete_webhook_event(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_webhook_event(TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- The existing payment RPC updates shipping_status to "Preparando". This
-- trigger makes the separation explicit even if the server stops immediately
-- after the payment transaction commits.
CREATE OR REPLACE FUNCTION public.mark_freight_pending_after_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.payment_status = 'Pago'
     AND OLD.payment_status IS DISTINCT FROM 'Pago'
     AND NEW.melhor_envio_shipment_id IS NULL THEN
    NEW.shipping_status := 'Aguardando compra de frete';
    NEW.shipment_purchase_status := 'not_started';
    NEW.label_generation_status := 'not_started';
    NEW.shipment_last_error := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_mark_freight_pending_after_payment ON public.orders;
CREATE TRIGGER trg_orders_mark_freight_pending_after_payment
BEFORE UPDATE OF payment_status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.mark_freight_pending_after_payment();

-- Reconcile legacy paid orders without pretending a label was purchased.
UPDATE public.orders
SET shipment_purchase_status = CASE
      WHEN melhor_envio_shipment_id IS NOT NULL THEN 'purchased'
      ELSE 'not_started'
    END,
    label_generation_status = CASE
      WHEN shipping_label_url IS NOT NULL THEN 'generated'
      ELSE 'not_started'
    END,
    shipping_status = CASE
      WHEN melhor_envio_shipment_id IS NULL THEN 'Aguardando compra de frete'
      ELSE shipping_status
    END,
    shipment_purchased_at = CASE
      WHEN melhor_envio_shipment_id IS NOT NULL THEN COALESCE(shipment_purchased_at, updated_at)
      ELSE shipment_purchased_at
    END,
    label_generated_at = CASE
      WHEN shipping_label_url IS NOT NULL THEN COALESCE(label_generated_at, updated_at)
      ELSE label_generated_at
    END
WHERE payment_status = 'Pago';

COMMIT;
