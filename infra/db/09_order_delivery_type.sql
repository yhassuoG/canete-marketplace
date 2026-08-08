-- =============================================================================
-- MIGRACIÓN 09: Añadir delivery_type a orders (pickup vs delivery)
-- Permite distinguir notificaciones WhatsApp: "listo para recoger" vs "en camino"
-- =============================================================================

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(10) NOT NULL DEFAULT 'delivery';

-- Validación: solo 'pickup' o 'delivery'
ALTER TABLE orders
    ADD CONSTRAINT chk_delivery_type CHECK (delivery_type IN ('pickup', 'delivery'));

COMMENT ON COLUMN orders.delivery_type IS 'pickup = recojo en local, delivery = envío a domicilio';
