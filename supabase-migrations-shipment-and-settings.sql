-- ==============================================================================
-- MARMOT STREETWEAR | MIGRATION: SHIPMENT OPERATIONS & APP SETTINGS
-- Execute este script no Supabase SQL Editor (Dashboard > SQL Editor)
-- ==============================================================================

-- 1. TABELA DE OPERAÇÕES DE REMESSA (Idempotência e Lock Concorrente)
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
CREATE INDEX IF NOT EXISTS idx_shipment_operations_updated_at ON public.shipment_operations (updated_at);

-- Habilitar RLS para shipment_operations
ALTER TABLE public.shipment_operations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shipment operations admin and service read" ON public.shipment_operations;
CREATE POLICY "Shipment operations admin and service read"
    ON public.shipment_operations FOR SELECT
    USING (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Shipment operations admin and service insert" ON public.shipment_operations;
CREATE POLICY "Shipment operations admin and service insert"
    ON public.shipment_operations FOR INSERT
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Shipment operations admin and service update" ON public.shipment_operations;
CREATE POLICY "Shipment operations admin and service update"
    ON public.shipment_operations FOR UPDATE
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Shipment operations admin delete" ON public.shipment_operations;
CREATE POLICY "Shipment operations admin delete"
    ON public.shipment_operations FOR DELETE
    USING (public.is_admin());

-- 2. TABELA DE CONFIGURAÇÕES DA APLICAÇÃO (Dados não-secretos como remetente e frete)
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
    USING (true);

DROP POLICY IF EXISTS "App settings admin write" ON public.app_settings;
CREATE POLICY "App settings admin write"
    ON public.app_settings FOR ALL
    USING (public.is_admin() OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 3. INICIALIZAR REGISTRO shipping_settings SE NÃO EXISTIR
INSERT INTO public.app_settings (key, value, updated_at)
VALUES (
    'shipping_settings',
    jsonb_build_object(
        'originPostalCode', '03806010',
        'defaultWeight', 0.35,
        'defaultHeight', 4,
        'defaultWidth', 20,
        'defaultLength', 25,
        'sender', jsonb_build_object(
            'name', 'Marmot Confecções',
            'document', '',
            'stateRegister', 'ISENTO',
            'phone', '11988421092',
            'email', 'contato@marmot.com.br',
            'street', 'Avenida Celso Garcia',
            'number', '1200',
            'complement', '',
            'neighborhood', 'Brás',
            'city', 'São Paulo',
            'state', 'SP',
            'cep', '03806010'
        )
    ),
    now()
)
ON CONFLICT (key) DO NOTHING;

-- 4. LIMPEZA DE CÓDIGOS DE RASTREIO ARTIFICIAIS LEGADOS (ex: MM26185554BR no pedido MM-716508)
UPDATE public.orders
SET 
    tracking_code = NULL,
    updated_at = now()
WHERE 
    melhor_envio_shipment_id IS NULL
    AND shipping_label_url IS NULL
    AND (
        tracking_code LIKE 'BR-SIMULATED-%'
        OR tracking_code ~* '^MM[0-9]{8}BR$'
        OR tracking_code ~* '^MM-[0-9]+-[0-9]+$'
    );

-- Recarregar cache do PostgREST
NOTIFY pgrst, 'reload schema';
