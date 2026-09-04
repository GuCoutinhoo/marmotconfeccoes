-- Migration: 20260904_protect_schema_migration_history.sql
-- Description: Protect applied_at in public.schema_migrations from accidental overwrite on updates

CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version TEXT PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function to preserve applied_at on updates
CREATE OR REPLACE FUNCTION public.preserve_schema_migration_applied_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Preserve existing applied_at timestamp when a row is updated
    NEW.applied_at := OLD.applied_at;
    RETURN NEW;
END;
$$;

-- Revoke execution from PUBLIC, anon, and authenticated
REVOKE ALL ON FUNCTION public.preserve_schema_migration_applied_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.preserve_schema_migration_applied_at() TO service_role;

-- Drop trigger if exists to ensure idempotency
DROP TRIGGER IF EXISTS trg_preserve_schema_migration_applied_at ON public.schema_migrations;

-- Create BEFORE UPDATE trigger
CREATE TRIGGER trg_preserve_schema_migration_applied_at
    BEFORE UPDATE ON public.schema_migrations
    FOR EACH ROW
    EXECUTE FUNCTION public.preserve_schema_migration_applied_at();

-- Record this migration idempotently with ON CONFLICT DO NOTHING (never overwriting applied_at)
INSERT INTO public.schema_migrations (version, description)
VALUES ('20260904_protect_schema_migration_history', 'Preserve applied_at immutability in schema_migrations')
ON CONFLICT (version) DO NOTHING;
