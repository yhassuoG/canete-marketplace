-- =============================================================================
-- MIGRACIÓN 16: Tenant "Zelita Alfajores" — alfajores artesanales
--   * Tenant: b1000000-0000-0000-0000-000000000006  (slug: alfajores)
--   * Owner:  c1000000-0000-0000-0000-000000000007  (zelita@demo.com / demo123)
--   * Config: allows_delivery=TRUE, allows_pickup=TRUE, delivery_fee=6.00
--             yape_phone='+51 955 006 006', yape_qr_url=NULL (placeholder)
--   * Productos: alfajores clásicos, especiales, combos, bebidas
-- Idempotente: ON CONFLICT DO NOTHING / DO UPDATE
-- =============================================================================

SET search_path TO canete_marketplace, public;

-- =============================================================================
-- TENANT
-- =============================================================================

INSERT INTO tenants (
    id, slug, name, tagline, description, category, location, phone,
    primary_color, gradient, plan_id, status,
    rating, review_count, monthly_revenue, reservations_this_month, orders_this_month,
    features
) VALUES
(
    'b1000000-0000-0000-0000-000000000006',
    'alfajores',
    'Zelita Alfajores',
    'Alfajores artesanales rellenos de dulce de leche',
    'Alfajores artesanales de masa suave, rellenos de manjar blanco y bañados en chocolate. Tradición cañetana.',
    'restaurant',
    'San Vicente de Cañete',
    '+51 955 006 006',
    '#92400e',
    'linear-gradient(135deg,#92400e 0%,#d97706 100%)',
    'a1000000-0000-0000-0000-000000000001',  -- starter
    'active',
    4.9, 210, 8900.00, 0, 68,
    ARRAY['delivery', 'pickup', 'catalog', 'reviews']
)
ON CONFLICT (slug) DO UPDATE SET
    name            = EXCLUDED.name,
    tagline         = EXCLUDED.tagline,
    description     = EXCLUDED.description,
    category        = EXCLUDED.category,
    location        = EXCLUDED.location,
    phone           = EXCLUDED.phone,
    primary_color   = EXCLUDED.primary_color,
    gradient        = EXCLUDED.gradient,
    plan_id         = EXCLUDED.plan_id,
    status          = EXCLUDED.status,
    features        = EXCLUDED.features;

-- =============================================================================
-- TENANT CONFIG — delivery + pickup, Yape habilitado
-- =============================================================================

INSERT INTO tenant_config (
    tenant_id, lat, lng, address, opening_hours, social_links,
    allows_delivery, allows_pickup, delivery_fee, yape_phone, yape_qr_url
) VALUES
(
    'b1000000-0000-0000-0000-000000000006',
    -13.0735, -76.4510,
    'Jr. 2 de Mayo 145, San Vicente de Cañete',
    '{"mon":{"open":"09:00","close":"20:00"},"tue":{"open":"09:00","close":"20:00"},"wed":{"open":"09:00","close":"20:00"},"thu":{"open":"09:00","close":"20:00"},"fri":{"open":"09:00","close":"21:00"},"sat":{"open":"09:00","close":"21:00"},"sun":{"open":"10:00","close":"18:00"}}',
    '{"instagram":"@zelitaalfajores","facebook":"ZelitaAlfajoresCanete","whatsapp":"+51955006006"}',
    TRUE,           -- allows_delivery
    TRUE,           -- allows_pickup
    6.00,           -- delivery_fee
    '+51 955 006 006',  -- yape_phone
    NULL            -- yape_qr_url (se puede subir luego desde el panel admin)
)
ON CONFLICT (tenant_id) DO UPDATE SET
    lat             = EXCLUDED.lat,
    lng             = EXCLUDED.lng,
    address         = EXCLUDED.address,
    opening_hours   = EXCLUDED.opening_hours,
    social_links    = EXCLUDED.social_links,
    allows_delivery = EXCLUDED.allows_delivery,
    allows_pickup   = EXCLUDED.allows_pickup,
    delivery_fee    = EXCLUDED.delivery_fee,
    yape_phone      = EXCLUDED.yape_phone,
    yape_qr_url     = EXCLUDED.yape_qr_url;

-- =============================================================================
-- USUARIO dueño (business_owner)
-- BCrypt de "demo123" = $2a$12$K8CqoP0gkOBGJ7XcYiTKlOeHlJ9yg8L.H5iKZhiCN2nWQqHGPDnAi
-- =============================================================================

INSERT INTO users (id, email, password_hash, full_name, role, tenant_id, tenant_slug, status)
VALUES
(
    'c1000000-0000-0000-0000-000000000007',
    'zelita@demo.com',
    '$2a$12$K8CqoP0gkOBGJ7XcYiTKlOeHlJ9yg8L.H5iKZhiCN2nWQqHGPDnAi',
    'Zelita Admin',
    'business_owner',
    'b1000000-0000-0000-0000-000000000006',
    'alfajores',
    'active'
)
ON CONFLICT (email) DO UPDATE SET
    full_name   = EXCLUDED.full_name,
    role        = EXCLUDED.role,
    tenant_id   = EXCLUDED.tenant_id,
    tenant_slug = EXCLUDED.tenant_slug,
    status      = EXCLUDED.status;

-- =============================================================================
-- PRODUCTOS — Zelita Alfajores
-- =============================================================================

INSERT INTO products (id, tenant_id, name, description, price, category, is_available, sort_order)
VALUES
-- ── Alfajores clásicos ──
('d1000000-0006-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000006',
 'Alfajor clásico x6',            '6 alfajores de masa suave rellenos de manjar blanco',          18.00, 'Alfajores Clásicos', true, 1),
('d1000000-0006-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000006',
 'Alfajor clásico x12',           '12 alfajores de masa suave rellenos de manjar blanco',         34.00, 'Alfajores Clásicos', true, 2),
('d1000000-0006-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000006',
 'Alfajor de chocolate x6',       '6 alfajores bañados en chocolate semiamargo',                  22.00, 'Alfajores Clásicos', true, 3),
('d1000000-0006-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000006',
 'Alfajor de chocolate x12',      '12 alfajores bañados en chocolate semiamargo',                 42.00, 'Alfajores Clásicos', true, 4),

-- ── Alfajores especiales ──
('d1000000-0006-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000006',
 'Alfajor de nuez x6',            '6 alfajores rellenos de manjar con trozos de nuez',            24.00, 'Alfajores Especiales', true, 10),
('d1000000-0006-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000006',
 'Alfajor de coco x6',            '6 alfajores con coco rallado y manjar blanco',                 23.00, 'Alfajores Especiales', true, 11),
('d1000000-0006-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000006',
 'Alfajor doble dulce x6',        '6 alfajores de doble relleno de manjar blanco',                26.00, 'Alfajores Especiales', true, 12),
('d1000000-0006-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000006',
 'Alfajor de lúcuma x6',          '6 alfajores rellenos de manjar de lúcuma',                     25.00, 'Alfajores Especiales', true, 13),

-- ── Combos ──
('d1000000-0006-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000006',
 'Combo degustación 18 alfajores', '6 clásicos + 6 de chocolate + 6 de nuez',                     45.00, 'Combos',              true, 20),
('d1000000-0006-0000-0000-00000000000a', 'b1000000-0000-0000-0000-000000000006',
 'Combo regalo 24 alfajores',      'Caja regalo: 24 alfajores variados con moño',                  65.00, 'Combos',              true, 21),

-- ── Bebidas ──
('d1000000-0006-0000-0000-00000000000b', 'b1000000-0000-0000-0000-000000000006',
 'Café pasado',                   'Café pasado caliente 200ml',                                     5.00, 'Bebidas',             true, 30),
('d1000000-0006-0000-0000-00000000000c', 'b1000000-0000-0000-0000-000000000006',
 'Chocolate caliente',            'Chocolate caliente 250ml',                                       7.00, 'Bebidas',             true, 31),
('d1000000-0006-0000-0000-00000000000d', 'b1000000-0000-0000-0000-000000000006',
 'Inca Kola 1.5L',                'Botella 1.5 litros',                                             9.00, 'Bebidas',             true, 32),
('d1000000-0006-0000-0000-00000000000e', 'b1000000-0000-0000-0000-000000000006',
 'Agua mineral 500ml',            'Botella personal',                                               3.00, 'Bebidas',             true, 33)
ON CONFLICT (id) DO UPDATE SET
    name          = EXCLUDED.name,
    description   = EXCLUDED.description,
    price         = EXCLUDED.price,
    category      = EXCLUDED.category,
    is_available  = EXCLUDED.is_available,
    sort_order    = EXCLUDED.sort_order;

-- =============================================================================
-- CLIENTES de ejemplo
-- =============================================================================

INSERT INTO customers (id, tenant_id, full_name, email, phone, address, total_orders, total_spent)
VALUES
('e1000000-0006-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000006',
 'Ana Torres', 'ana@gmail.com', '+51 999 666 001', 'Jr. Lima 300, San Vicente', 4, 112.00),
('e1000000-0006-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000006',
 'Luis Fernández', NULL,         '+51 999 666 002', 'Av. Grau 789, San Vicente',  2,  68.00)
ON CONFLICT (id) DO NOTHING;
