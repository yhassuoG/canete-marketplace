-- =============================================================================
-- MIGRACIÓN 26: Limpiar datos transaccionales de producción
--
-- Elimina todas las órdenes, order_items, reservas, reviews, customers,
-- cupones, campañas, analytics y comprobantes de pago.
-- CONSERVA: tenants, users, tenant_config, products (catálogo), plans.
--
-- Esto resetea los contadores de los tenants a cero para un fresh start.
-- =============================================================================

SET search_path TO canete_marketplace, public;

-- ── 1. Eliminar datos transaccionales (en orden de dependencias) ──

-- Comprobantes de pago (referencian orders)
DELETE FROM payment_proofs;

-- Order items (referencian orders, cascade)
DELETE FROM order_items;

-- Órdenes
DELETE FROM orders;

-- Reservas
DELETE FROM reservations;

-- Reviews
DELETE FROM reviews;

-- Cupones
DELETE FROM coupons;

-- Campañas
DELETE FROM campaigns;

-- Analytics histórico
DELETE FROM analytics_daily;

-- Clientes (customers)
DELETE FROM customers;

-- ── 2. Resetear contadores en tenants ──

UPDATE tenants
   SET reservations_this_month = 0,
       orders_this_month       = 0,
       monthly_revenue         = 0;

-- ── 3. Verificación ──

DO $$
DECLARE
    o_count INT;
    r_count INT;
    c_count INT;
BEGIN
    SELECT COUNT(*) INTO o_count FROM orders;
    SELECT COUNT(*) INTO r_count FROM reservations;
    SELECT COUNT(*) INTO c_count FROM customers;

    RAISE NOTICE 'Limpieza completada: orders=%, reservations=%, customers=%', o_count, r_count, c_count;
END $$;
