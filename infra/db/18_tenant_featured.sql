-- =============================================================================
-- MIGRACIÓN 18: Add featured flag to tenants table
-- Permite marcar negocios como "destacados" para mostrarlos en la home page.
-- (Esta migración existía como 16_tenant_featured.sql en Backend/src/main/resources/db/
--  pero no se había copiado a infra/db/ para aplicarse en producción.)
-- =============================================================================

SET search_path TO canete_marketplace, public;

ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;

-- Índice para buscar rápidamente los destacados
CREATE INDEX IF NOT EXISTS idx_tenants_featured
    ON tenants (featured)
    WHERE featured = TRUE;

COMMENT ON COLUMN tenants.featured IS 'TRUE si el negocio debe aparecer destacado en la home page';
