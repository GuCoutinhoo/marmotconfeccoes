BEGIN;

-- Event-driven recovery: a repeated notification can recover the order linked
-- to a previously completed payment event without reopening the payment
-- mutation. The shipment processor still acquires its own atomic lease.
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
    RETURN jsonb_build_object(
      'should_process', TRUE,
      'status', 'claimed',
      'order_id', v_event.order_id
    );
  END IF;

  SELECT * INTO v_event
  FROM public.webhook_events
  WHERE gateway = p_gateway AND event_key = p_event_key
  FOR UPDATE;

  IF v_event.status = 'completed' THEN
    RETURN jsonb_build_object(
      'should_process', FALSE,
      'status', 'already_completed',
      'order_id', v_event.order_id
    );
  END IF;

  IF v_event.status = 'processing' AND v_event.updated_at > NOW() - INTERVAL '3 minutes' THEN
    RETURN jsonb_build_object(
      'should_process', FALSE,
      'status', 'currently_processing',
      'order_id', v_event.order_id
    );
  END IF;

  UPDATE public.webhook_events
  SET status = 'processing',
      topic = p_topic,
      payload = p_payload,
      attempt_count = attempt_count + 1,
      last_error = NULL,
      updated_at = NOW()
  WHERE gateway = p_gateway AND event_key = p_event_key
  RETURNING * INTO v_event;

  RETURN jsonb_build_object(
    'should_process', TRUE,
    'status', 'reclaimed',
    'order_id', v_event.order_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_webhook_event(TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_webhook_event(TEXT, TEXT, TEXT, JSONB) TO service_role;

COMMIT;
