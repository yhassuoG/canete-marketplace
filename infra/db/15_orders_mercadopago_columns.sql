-- =============================================================================
-- Archivo: 15_orders_mercadopago_columns.sql
-- Descripción: Agrega columnas de Mercado Pago a la tabla orders.
--              Estas columnas son requeridas por OrderEntity.java pero no fueron
--              incluidas en la migración 14 (multi_tenant_mp_and_plans).
--              Sin estas columnas, Hibernate falla con SQLState 42703 al hacer
--              INSERT/SELECT en orders (error: "no existe la columna mp_init_point").
-- Fecha: 2026-07-31
-- =============================================================================

-- Columnas de Mercado Pago en orders
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS mp_preference_id  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS mp_payment_id     BIGINT,
    ADD COLUMN IF NOT EXISTS mp_payment_status VARCHAR(30),
    ADD COLUMN IF NOT EXISTS mp_init_point     TEXT;

-- Índices útiles para consultas de webhook/pago
CREATE INDEX IF NOT EXISTS idx_orders_mp_preference_id ON orders(mp_preference_id) WHERE mp_preference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_mp_payment_id    ON orders(mp_payment_id)    WHERE mp_payment_id    IS NOT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN orders.mp_preference_id  IS 'ID de la preferencia de pago creada en Mercado Pago.';
COMMENT ON COLUMN orders.mp_payment_id     IS 'ID del pago asignado por Mercado Pago (una vez procesado).';
COMMENT ON COLUMN orders.mp_payment_status IS 'Estado del pago en MP: pending | approved | rejected | cancelled | refunded.';
COMMENT ON COLUMN orders.mp_init_point     IS 'URL de checkout (init_point) devuelta por MP para redirigir al cliente.';

-- =============================================================================
-- Fin de la migración
-- =============================================================================
