-- =============================================================================
-- MIGRACIÓN 11: Tenant "Alitas del Puerto" — solo delivery + Yape
--   * Tenant: b1000000-0000-0000-0000-000000000005  (slug: alitas-del-puerto)
--   * Owner:  c1000000-0000-0000-0000-000000000006  (alitas@demo.com / demo123)
--   * Config: allows_delivery=TRUE, allows_pickup=FALSE, delivery_fee=5.00
--             yape_phone='+51 944 005 005', yape_qr_url=NULL (placeholder)
--   * Productos: alitas, acompañantes, bebidas, combos
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
    'b1000000-0000-0000-0000-000000000005',
    'alitas-del-puerto',
    'Alitas del Puerto',
    'Las mejores alitas broaster de Cañete',
    'Alitas broaster y a la parrilla con salsas de la casa. Solo delivery.',
    'restaurant',
    'San Vicente de Cañete',
    '+51 944 005 005',
    '#b91c1c',
    'linear-gradient(135deg,#b91c1c 0%,#dc2626 100%)',
    'a1000000-0000-0000-0000-000000000001',  -- starter
    'active',
    4.8, 156, 12400.00, 0, 42,
    ARRAY['delivery', 'catalog', 'reviews']
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
-- TENANT CONFIG — solo delivery, Yape habilitado
-- =============================================================================

INSERT INTO tenant_config (
    tenant_id, lat, lng, address, opening_hours, social_links,
    allows_delivery, allows_pickup, delivery_fee, yape_phone, yape_qr_url
) VALUES
(
    'b1000000-0000-0000-0000-000000000005',
    -13.0720, -76.4600,
    'Av. Mariscal Cáceres 880, San Vicente de Cañete',
    '{"mon":{"open":"17:00","close":"23:30"},"tue":{"open":"17:00","close":"23:30"},"wed":{"open":"17:00","close":"23:30"},"thu":{"open":"17:00","close":"23:30"},"fri":{"open":"16:00","close":"00:00"},"sat":{"open":"16:00","close":"00:00"},"sun":{"open":"16:00","close":"23:30"}}',
    '{"instagram":"@alitasdelpuerto","facebook":"AlitasDelPuertoCanete","whatsapp":"+51944005005"}',
    TRUE,           -- allows_delivery
    FALSE,          -- allows_pickup  (solo delivery)
    5.00,           -- delivery_fee
    '+51 944 005 005',  -- yape_phone
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
    'c1000000-0000-0000-0000-000000000006',
    'alitas@demo.com',
    '$2a$12$K8CqoP0gkOBGJ7XcYiTKlOeHlJ9yg8L.H5iKZhiCN2nWQqHGPDnAi',
    'Roberto Alitas',
    'business_owner',
    'b1000000-0000-0000-0000-000000000005',
    'alitas-del-puerto',
    'active'
)
ON CONFLICT (email) DO UPDATE SET
    full_name   = EXCLUDED.full_name,
    role        = EXCLUDED.role,
    tenant_id   = EXCLUDED.tenant_id,
    tenant_slug = EXCLUDED.tenant_slug,
    status      = EXCLUDED.status;

-- =============================================================================
-- PRODUCTOS — Alitas del Puerto
-- =============================================================================

INSERT INTO products (id, tenant_id, name, description, price, category, is_available, sort_order)
VALUES
-- ── Alitas broaster (por docena / media docena) ──
('d1000000-0005-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000005',
 '6 Alitas Broaster Clásicas',   'Media docena de alitas broaster crispy con salsa de la casa',     24.00, 'Alitas Broaster', true, 1),
('d1000000-0005-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000005',
 '12 Alitas Broaster Clásicas',  'Docena de alitas broaster crispy con salsa de la casa',           42.00, 'Alitas Broaster', true, 2),
('d1000000-0005-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000005',
 '6 Alitas BBQ',                 'Media docena con salsa BBQ ahumada',                              26.00, 'Alitas Broaster', true, 3),
('d1000000-0005-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000005',
 '12 Alitas BBQ',                'Docena con salsa BBQ ahumada',                                    46.00, 'Alitas Broaster', true, 4),
('d1000000-0005-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000005',
 '6 Alitas Buffalo',             'Media docena con salsa buffalo picante',                          26.00, 'Alitas Broaster', true, 5),
('d1000000-0005-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000005',
 '12 Alitas Buffalo',            'Docena con salsa buffalo picante',                                46.00, 'Alitas Broaster', true, 6),
('d1000000-0005-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000005',
 '6 Alitas Honey Mustard',       'Media docena con miel y mostaza',                                 27.00, 'Alitas Broaster', true, 7),
('d1000000-0005-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000005',
 '12 Alitas Honey Mustard',      'Docena con miel y mostaza',                                       48.00, 'Alitas Broaster', true, 8),

-- ── Alitas a la parrilla ──
('d1000000-0005-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000005',
 '6 Alitas a la Parrilla',       'Media docena a la parrilla con adobo de la casa',                 25.00, 'Alitas Parrilla', true, 10),
('d1000000-0005-0000-0000-00000000000a', 'b1000000-0000-0000-0000-000000000005',
 '12 Alitas a la Parrilla',      'Docena a la parrilla con adobo de la casa',                       44.00, 'Alitas Parrilla', true, 11),

-- ── Combos familiares ──
('d1000000-0005-0000-0000-00000000000b', 'b1000000-0000-0000-0000-000000000005',
 'Combo Familiar 24 alitas',     '24 alitas broaster + 2 porciones de papas + 2 bebidas 1.5L',     79.00, 'Combos',          true, 20),
('d1000000-0005-0000-0000-00000000000c', 'b1000000-0000-0000-0000-000000000005',
 'Combo Amigos 18 alitas',       '18 alitas (mezcla de sabores) + papas grandes + 1.5L',            59.00, 'Combos',          true, 21),

-- ── Acompañantes ──
('d1000000-0005-0000-0000-00000000000d', 'b1000000-0000-0000-0000-000000000005',
 'Papas fritas grandes',         'Porción grande de papas fritas crispy',                           12.00, 'Acompañantes',    true, 30),
('d1000000-0005-0000-0000-00000000000e', 'b1000000-0000-0000-0000-000000000005',
 'Aros de cebolla',              '8 aros de cebolla empanizados con salsa ranch',                   14.00, 'Acompañantes',    true, 31),
('d1000000-0005-0000-0000-00000000000f', 'b1000000-0000-0000-0000-000000000005',
 'Arroz chaufa de pollo',        'Porción individual de arroz chaufa',                              16.00, 'Acompañantes',    true, 32),

-- ── Bebidas ──
('d1000000-0005-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000005',
 'Inca Kola 1.5L',               'Botella 1.5 litros',                                              9.00,  'Bebidas',         true, 40),
('d1000000-0005-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000005',
 'Coca Cola 1.5L',               'Botella 1.5 litros',                                              9.00,  'Bebidas',         true, 41),
('d1000000-0005-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000005',
 'Chicha morada 1L',             'Chicha morada de la casa',                                        10.00, 'Bebidas',         true, 42),
('d1000000-0005-0000-0000-000000000013', 'b1000000-0000-0000-0000-000000000005',
 'Agua mineral 500ml',           'Botella personal',                                                3.00,  'Bebidas',         true, 43)
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
('e1000000-0005-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000005',
 'Daniela Vargas', 'daniela@gmail.com', '+51 999 555 001', 'Jr. Sucre 120, San Vicente', 3, 142.00),
('e1000000-0005-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000005',
 'Carlos Mendoza', NULL,                '+51 999 555 002', 'Av. Lima 456, San Vicente',  5, 268.00)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- ÓRDENES de ejemplo (con payment_reference para Yape)
-- =============================================================================

INSERT INTO orders (id, tenant_id, customer_id, customer_name, customer_phone, customer_address,
                    status, payment_method, payment_reference, subtotal, delivery_fee, discount, total)
VALUES
(
    'f1000000-0005-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000005',
    'e1000000-0005-0000-0000-000000000001',
    'Daniela Vargas', '+51 999 555 001', 'Jr. Sucre 120, San Vicente',
    'delivered', 'yape', '8012345601', 46.00, 5.00, 0, 51.00
),
(
    'f1000000-0005-0000-0000-000000000002',
    'b1000000-0000-0000-0000-000000000005',
    'e1000000-0005-0000-0000-000000000002',
    'Carlos Mendoza', '+51 999 555 002', 'Av. Lima 456, San Vicente',
    'preparing', 'yape', '8012345602', 79.00, 5.00, 0, 84.00
)
ON CONFLICT (id) DO NOTHING;

-- Order items
INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
VALUES
('f1000000-0005-0000-0000-000000000001','d1000000-0005-0000-0000-000000000002','12 Alitas Broaster Clásicas',42.00,1,42.00),
('f1000000-0005-0000-0000-000000000001','d1000000-0005-0000-0000-000000000010','Inca Kola 1.5L',              9.00,1, 9.00),
('f1000000-0005-0000-0000-000000000002','d1000000-0005-0000-0000-00000000000b','Combo Familiar 24 alitas',   79.00,1,79.00)
ON CONFLICT (id) DO NOTHING;
