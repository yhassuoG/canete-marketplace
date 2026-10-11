-- =============================================================================
-- Cañete Marketplace — Seed Data
-- Archivo: 03_seed.sql
-- Ejecutar después de 02_procedures.sql
-- ADVERTENCIA: usa INSERT ... ON CONFLICT DO NOTHING para ser idempotente.
--
-- IMPORTANTE: Los tenants demo (muelle-pacifico, paraiso-lunahuana,
-- vina-del-sol, hotel-luna, alitas-del-puerto) y todos sus datos asociados
-- (usuarios demo, productos, clientes, órdenes, reservas, reviews, cupones,
-- campañas, analytics) fueron REMOVIDOS permanentemente.
-- Los tenants reales (comida, makis, alfajores) se crean vía API o migraciones
-- dedicadas (16_zelita_tenant.sql). No re-agregar datos demo aquí.
-- =============================================================================

SET search_path TO canete_marketplace, public;

-- =============================================================================
-- PLANES (necesarios para que los tenants reales funcionen)
-- =============================================================================

INSERT INTO plans (id, name, display_name, price_monthly, max_products, max_orders_per_month, features)
VALUES
    ('a1000000-0000-0000-0000-000000000001', 'starter',    'Starter',    99.00,  50,  500,
     ARRAY['catalog', 'delivery', 'reviews']),
    ('a1000000-0000-0000-0000-000000000002', 'premium',    'Premium',   299.00, 200, 2000,
     ARRAY['catalog', 'delivery', 'reservations', 'reviews', 'loyalty', 'campaigns']),
    ('a1000000-0000-0000-0000-000000000003', 'enterprise', 'Enterprise',799.00,  -1,   -1,
     ARRAY['catalog', 'delivery', 'reservations', 'reviews', 'loyalty', 'campaigns', 'tickets', 'api_access'])
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- USUARIO ADMIN GLOBAL
-- BCrypt de "admin123" = $2a$12$HGzqxQHPjzXQ01Xq2XW0yO1dCvVE9eGJ4S6E0F7l8wdCBRqt3gPZi
-- =============================================================================

INSERT INTO users (id, email, password_hash, full_name, role, tenant_id, tenant_slug, status)
VALUES
(
    'c1000000-0000-0000-0000-000000000001',
    'admin@canete.app',
    '$2a$12$HGzqxQHPjzXQ01Xq2XW0yO1dCvVE9eGJ4S6E0F7l8wdCBRqt3gPZi',
    'Administrador Cañete',
    'admin', NULL, NULL, 'active'
)
ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- FIN DEL SEED
-- Los tenants reales se gestionan vía:
--   - 16_zelita_tenant.sql (Zelita Alfajores)
--   - API/registro para comida y makis
-- No hay datos demo en este archivo.
-- =============================================================================
