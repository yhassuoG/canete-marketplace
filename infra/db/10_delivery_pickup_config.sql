-- =============================================================================
-- MIGRACIÓN 10: Configuración delivery/pickup por tenant + referencia de pago
--   * tenant_config.allows_delivery  : si el tenant ofrece delivery
--   * tenant_config.allows_pickup    : si el tenant ofrece recojo en local
--   * tenant_config.delivery_fee     : costo fijo de delivery (opcional)
--   * tenant_config.yape_phone       : número Yape para confirmaciones
--   * tenant_config.yape_qr_url      : URL del QR de Yape
--   * orders.payment_reference       : código/ referencia de la transferencia Yape
-- =============================================================================

SET search_path TO canete_marketplace, public;

ALTER TABLE tenant_config
    ADD COLUMN IF NOT EXISTS allows_delivery  BOOLEAN      NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS allows_pickup    BOOLEAN      NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS delivery_fee     NUMERIC(10,2)          DEFAULT 0,
    ADD COLUMN IF NOT EXISTS yape_phone       VARCHAR(20),
    ADD COLUMN IF NOT EXISTS yape_qr_url      VARCHAR(500);

COMMENT ON COLUMN tenant_config.allows_delivery IS 'TRUE si el tenant ofrece delivery a domicilio';
COMMENT ON COLUMN tenant_config.allows_pickup   IS 'TRUE si el tenant ofrece recojo en local';
COMMENT ON COLUMN tenant_config.delivery_fee    IS 'Costo fijo de delivery (0 = gratis)';
COMMENT ON COLUMN tenant_config.yape_phone      IS 'Número Yape para que el cliente envíe el pago';
COMMENT ON COLUMN tenant_config.yape_qr_url     IS 'URL del QR code de Yape para mostrar en checkout';

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);

COMMENT ON COLUMN orders.payment_reference IS 'Referencia de pago (ej. código de operación Yape/Plin)';
