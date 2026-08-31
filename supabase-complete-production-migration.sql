-- ==============================================================================
-- MARMOT STREETWEAR | MIGRATION DEFINITIVA DE PRODUÇÃO (IDEMPOTENTE E SEGURA)
-- Execute este script completo no Supabase SQL Editor (Dashboard > SQL Editor)
-- ==============================================================================

-- 1. TABELA DE CONTROLE DE MIGRATIONS
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. FUNÇÃO AUXILIAR DE SEGURANÇA: is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR is_admin = true)
    ) OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role, anon;

-- 3. AJUSTES E COLUNAS NA TABELA profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Trigger para impedir que clientes alterem seu próprio campo 'role' ou 'is_admin'
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role OR NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
      RAISE EXCEPTION 'Acesso negado: não é permitido alterar permissões administrativas.';
    END IF;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
CREATE TRIGGER tr_protect_profile_role
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_role();

-- RLS para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile or admin" ON public.profiles;
CREATE POLICY "Users can view own profile or admin"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update own profile data" ON public.profiles;
CREATE POLICY "Users can update own profile data"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (auth.uid() = id OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
CREATE POLICY "Profiles insert policy"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id OR public.is_admin() OR auth.role() = 'service_role');

-- 4. AJUSTES E COLUNAS CRÍTICAS NA TABELA orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'Aguardando preparação';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS separation_started_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS in_transit_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS out_for_delivery_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mercado_pago_payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mercado_pago_preference_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS melhor_envio_shipment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_label_url TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_status ON public.orders (shipping_status);
CREATE INDEX IF NOT EXISTS idx_orders_mp_payment_id ON public.orders (mercado_pago_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_me_shipment_id ON public.orders (melhor_envio_shipment_id);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON public.orders (tracking_code);

-- RLS para orders (Seguro: apenas dono lê, inserts e updates via backend/service_role ou admin)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Orders select policy" ON public.orders;
CREATE POLICY "Orders select policy"
    ON public.orders FOR SELECT
    USING (
      (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
      public.is_admin() OR
      auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS "Orders insert policy" ON public.orders;
CREATE POLICY "Orders insert policy"
    ON public.orders FOR INSERT
    WITH CHECK (
      auth.role() = 'service_role' OR
      public.is_admin()
    );

DROP POLICY IF EXISTS "Orders update policy" ON public.orders;
CREATE POLICY "Orders update policy"
    ON public.orders FOR UPDATE
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 5. TABELA shipment_operations (Idempotência e Lock de Emissão de Frete)
CREATE TABLE IF NOT EXISTS public.shipment_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
    shipment_id TEXT,
    tracking_code TEXT,
    print_url TEXT,
    current_step TEXT,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipment_operations_order_id ON public.shipment_operations (order_id);
CREATE INDEX IF NOT EXISTS idx_shipment_operations_status ON public.shipment_operations (status);

ALTER TABLE public.shipment_operations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shipment operations admin access" ON public.shipment_operations;
CREATE POLICY "Shipment operations admin access"
    ON public.shipment_operations FOR ALL
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 6. TABELA app_settings (Configurações Privadas e Operacionais)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "App settings read" ON public.app_settings;
CREATE POLICY "App settings read"
    ON public.app_settings FOR SELECT
    USING (
      key NOT IN ('shipping_settings', 'payment_secrets', 'private_keys') OR
      public.is_admin() OR
      auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS "App settings write" ON public.app_settings;
CREATE POLICY "App settings write"
    ON public.app_settings FOR ALL
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 7. TABELAS DE SUPORTE OPERACIONAL E E-COMMERCE

-- user_addresses
CREATE TABLE IF NOT EXISTS public.user_addresses (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    cep TEXT NOT NULL,
    street TEXT NOT NULL,
    number TEXT NOT NULL,
    complement TEXT,
    neighborhood TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses (user_id);
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User addresses policy" ON public.user_addresses;
CREATE POLICY "User addresses policy"
    ON public.user_addresses FOR ALL
    USING (auth.uid() = user_id OR public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (auth.uid() = user_id OR public.is_admin() OR auth.role() = 'service_role');

-- cart_items
CREATE TABLE IF NOT EXISTS public.cart_items (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    variant JSONB NOT NULL DEFAULT '{}'::jsonb,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items (user_id);
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cart items policy" ON public.cart_items;
CREATE POLICY "Cart items policy"
    ON public.cart_items FOR ALL
    USING (auth.uid() = user_id OR public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (auth.uid() = user_id OR public.is_admin() OR auth.role() = 'service_role');

-- wishlist_items
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON public.wishlist_items (user_id);
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Wishlist items policy" ON public.wishlist_items;
CREATE POLICY "Wishlist items policy"
    ON public.wishlist_items FOR ALL
    USING (auth.uid() = user_id OR public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (auth.uid() = user_id OR public.is_admin() OR auth.role() = 'service_role');

-- product_reviews
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_email TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT NOT NULL,
    verified_purchase BOOLEAN DEFAULT false,
    likes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published' CHECK (status IN ('published', 'pending', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews (product_id);
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Product reviews select policy" ON public.product_reviews;
CREATE POLICY "Product reviews select policy"
    ON public.product_reviews FOR SELECT
    USING (status = 'published' OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Product reviews insert policy" ON public.product_reviews;
CREATE POLICY "Product reviews insert policy"
    ON public.product_reviews FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Product reviews admin policy" ON public.product_reviews;
CREATE POLICY "Product reviews admin policy"
    ON public.product_reviews FOR ALL
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- returns
CREATE TABLE IF NOT EXISTS public.returns (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    user_id UUID,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    reason TEXT NOT NULL,
    description TEXT,
    photos TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'Solicitada' CHECK (status IN ('Solicitada', 'Em Análise', 'Aprovada', 'Item Recebido', 'Concluída', 'Recusada')),
    admin_notes TEXT,
    tracking_code TEXT,
    refund_amount NUMERIC(10,2),
    history JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON public.returns (order_id);
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Returns access policy" ON public.returns;
CREATE POLICY "Returns access policy"
    ON public.returns FOR ALL
    USING (
      (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
      public.is_admin() OR
      auth.role() = 'service_role'
    )
    WITH CHECK (
      (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
      public.is_admin() OR
      auth.role() = 'service_role'
    );

-- inventory_movements
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    product_title TEXT NOT NULL,
    sku TEXT,
    variant JSONB DEFAULT '{}'::jsonb,
    quantity_change INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT NOT NULL,
    user_or_admin TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON public.inventory_movements (product_id);
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inventory movements admin access" ON public.inventory_movements;
CREATE POLICY "Inventory movements admin access"
    ON public.inventory_movements FOR ALL
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- store_banners
CREATE TABLE IF NOT EXISTS public.store_banners (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    image TEXT NOT NULL,
    mobile_image TEXT,
    link TEXT,
    button_text TEXT,
    position TEXT DEFAULT 'home_hero',
    order_index INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.store_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store banners public read" ON public.store_banners;
CREATE POLICY "Store banners public read"
    ON public.store_banners FOR SELECT
    USING (active = true OR public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Store banners admin write" ON public.store_banners;
CREATE POLICY "Store banners admin write"
    ON public.store_banners FOR ALL
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- newsletter_subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed')),
    source TEXT DEFAULT 'website',
    subscribed_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Newsletter insert policy" ON public.newsletter_subscribers;
CREATE POLICY "Newsletter insert policy"
    ON public.newsletter_subscribers FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Newsletter admin policy" ON public.newsletter_subscribers;
CREATE POLICY "Newsletter admin policy"
    ON public.newsletter_subscribers FOR ALL
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- email_logs
CREATE TABLE IF NOT EXISTS public.email_logs (
    id TEXT PRIMARY KEY,
    recipient TEXT NOT NULL,
    template TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL,
    error TEXT,
    provider_message_id TEXT,
    order_id TEXT,
    user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_logs_order_id ON public.email_logs (order_id);
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Email logs admin access" ON public.email_logs;
CREATE POLICY "Email logs admin access"
    ON public.email_logs FOR ALL
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- shipment_events
CREATE TABLE IF NOT EXISTS public.shipment_events (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    tracking_code TEXT,
    status TEXT NOT NULL,
    description TEXT,
    location TEXT,
    occurred_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shipment_events_order_id ON public.shipment_events (order_id);
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shipment events select" ON public.shipment_events;
CREATE POLICY "Shipment events select"
    ON public.shipment_events FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Shipment events admin write" ON public.shipment_events;
CREATE POLICY "Shipment events admin write"
    ON public.shipment_events FOR ALL
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- campaign_records
CREATE TABLE IF NOT EXISTS public.campaign_records (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    target_audience TEXT NOT NULL,
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'completed',
    sent_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.campaign_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Campaign records admin access" ON public.campaign_records;
CREATE POLICY "Campaign records admin access"
    ON public.campaign_records FOR ALL
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- webhook_events (Idempotência e controle de eventos de Webhook)
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    event_id TEXT NOT NULL,
    event_type TEXT,
    payload JSONB,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    order_id TEXT,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider, event_id)
);
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_event ON public.webhook_events (provider, event_id);
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Webhook events admin access" ON public.webhook_events;
CREATE POLICY "Webhook events admin access"
    ON public.webhook_events FOR ALL
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- payment_effects (Garantia de efeito único financeiro e de estoque)
CREATE TABLE IF NOT EXISTS public.payment_effects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id TEXT NOT NULL,
    effect_type TEXT NOT NULL,
    order_id TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (payment_id, effect_type)
);
CREATE INDEX IF NOT EXISTS idx_payment_effects_payment_id ON public.payment_effects (payment_id);
ALTER TABLE public.payment_effects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Payment effects admin access" ON public.payment_effects;
CREATE POLICY "Payment effects admin access"
    ON public.payment_effects FOR ALL
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 8. STORAGE BUCKET: product-images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage Policies
DROP POLICY IF EXISTS "Product images public read" ON storage.objects;
CREATE POLICY "Product images public read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Product images admin upload" ON storage.objects;
CREATE POLICY "Product images admin upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'product-images' AND
        (public.is_admin() OR auth.role() = 'service_role')
    );

DROP POLICY IF EXISTS "Product images admin update" ON storage.objects;
CREATE POLICY "Product images admin update"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'product-images' AND
        (public.is_admin() OR auth.role() = 'service_role')
    );

DROP POLICY IF EXISTS "Product images admin delete" ON storage.objects;
CREATE POLICY "Product images admin delete"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'product-images' AND
        (public.is_admin() OR auth.role() = 'service_role')
    );

-- 9. REGISTRAR MIGRATION CONCLUÍDA
INSERT INTO public.schema_migrations (version, description)
VALUES ('v1.0.0-production-readiness', 'Schema completo e seguro para venda real: tabelas, RLS, storage, índices e colunas de rastreio')
ON CONFLICT (version) DO UPDATE SET applied_at = now();
