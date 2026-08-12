-- =============================================================================
-- MIGRACIÓN 19: Platform-wide settings table
-- Permite guardar configuraciones globales de la plataforma (modo mantenimiento, etc.)
-- (Esta migración existía como 17_platform_settings.sql en Backend/src/main/resources/db/
--  pero no se había copiado a infra/db/ para aplicarse en producción.)
-- =============================================================================

SET search_path TO canete_marketplace, public;

CREATE TABLE IF NOT EXISTS platform_settings (
    setting_key   VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar configuración por defecto (modo mantenimiento desactivado)
INSERT INTO platform_settings (setting_key, setting_value)
VALUES ('maintenance_mode', 'false')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO platform_settings (setting_key, setting_value)
VALUES ('maintenance_message', 'Estamos realizando mejoras. Volveremos pronto.')
ON CONFLICT (setting_key) DO NOTHING;

COMMENT ON TABLE platform_settings IS 'Configuraciones globales de la plataforma (key-value)';
