-- =============================================================================
-- Cañete Marketplace — Seed Data
-- Archivo: 03_seed.sql
-- Ejecutar después de 02_procedures.sql
-- Datos idénticos a los mocks del código Java/TypeScript.
-- ADVERTENCIA: usa INSERT ... ON CONFLICT DO NOTHING para ser idempotente.
-- =============================================================================

SET search_path TO canete_marketplace, public;

-- Limpiar en orden de dependencia (solo en desarrollo)
-- TRUNCATE analytics_daily, campaigns, coupons, order_items, orders,
--          reservations, reviews, customers, products, tenant_config,
--          users, tenants, plans RESTART IDENTITY CASCADE;

-- =============================================================================
-- PLANES
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
-- TENANTS
-- =============================================================================

INSERT INTO tenants (
    id, slug, name, tagline, description, category, location, phone,
    primary_color, gradient, plan_id, status,
    rating, review_count, monthly_revenue, reservations_this_month, orders_this_month,
    features
) VALUES
-- Muelle Pacifico
(
    'b1000000-0000-0000-0000-000000000001',
    'muelle-pacifico',
    'Muelle Pacifico',
    'El mejor ceviche de Cañete',
    'Restaurante de pescados y mariscos frente al mar',
    'restaurant',
    'San Vicente de Cañete',
    '+51 944 001 001',
    '#0c4a6e',
    'linear-gradient(135deg,#0c4a6e 0%,#0369a1 100%)',
    'a1000000-0000-0000-0000-000000000002',  -- premium
    'active',
    4.9, 312, 16550.00, 32, 18,
    ARRAY['reservations', 'delivery', 'catalog', 'reviews', 'loyalty']
),
-- Paraíso Lunahuaná
(
    'b1000000-0000-0000-0000-000000000002',
    'paraiso-lunahuana',
    'Paraíso Lunahuaná',
    'Aventura y naturaleza en el río',
    'Tours de aventura y rafting en el Cañete',
    'experience',
    'Lunahuaná, Cañete',
    '+51 944 002 002',
    '#064e3b',
    'linear-gradient(135deg,#064e3b 0%,#065f46 100%)',
    'a1000000-0000-0000-0000-000000000002',  -- premium
    'active',
    4.8, 198, 22100.00, 48, 0,
    ARRAY['tickets', 'catalog', 'reviews']
),
-- Viña del Sol
(
    'b1000000-0000-0000-0000-000000000003',
    'vina-del-sol',
    'Viña del Sol',
    'Vinos de autor peruanos',
    'Bodega artesanal con catas y delivery de vinos',
    'winery',
    'Lunahuaná, Cañete',
    '+51 944 003 003',
    '#7c3aed',
    'linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%)',
    'a1000000-0000-0000-0000-000000000001',  -- starter
    'active',
    4.7, 87, 8400.00, 15, 22,
    ARRAY['delivery', 'catalog', 'reviews', 'campaigns']
),
-- Hotel Luna
(
    'b1000000-0000-0000-0000-000000000004',
    'hotel-luna',
    'Hotel Luna',
    'Descanso y vista al Pacífico',
    'Hotel boutique frente al mar con spa y restaurante',
    'hotel',
    'San Vicente de Cañete',
    '+51 944 004 004',
    '#1e3a5f',
    'linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 100%)',
    'a1000000-0000-0000-0000-000000000003',  -- enterprise
    'active',
    4.9, 445, 45200.00, 120, 0,
    ARRAY['reservations', 'catalog', 'reviews', 'loyalty', 'campaigns']
)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- TENANT CONFIG (ubicación GPS)
-- =============================================================================

INSERT INTO tenant_config (tenant_id, lat, lng, address, opening_hours, social_links)
VALUES
(
    'b1000000-0000-0000-0000-000000000001',
    -13.0750, -76.4610,
    'Av. Costanera 123, San Vicente de Cañete',
    '{"mon":{"open":"12:00","close":"22:00"},"tue":{"open":"12:00","close":"22:00"},"wed":{"open":"12:00","close":"22:00"},"thu":{"open":"12:00","close":"22:00"},"fri":{"open":"12:00","close":"23:00"},"sat":{"open":"11:00","close":"23:00"},"sun":{"open":"11:00","close":"21:00"}}',
    '{"instagram":"@muellepacifico","facebook":"MuellePacificoCanete"}'
),
(
    'b1000000-0000-0000-0000-000000000002',
    -12.9728, -76.1219,
    'Km 3 Carretera Lunahuaná - Cañete, Lunahuaná',
    '{"mon":{"closed":true},"tue":{"open":"08:00","close":"18:00"},"wed":{"open":"08:00","close":"18:00"},"thu":{"open":"08:00","close":"18:00"},"fri":{"open":"08:00","close":"19:00"},"sat":{"open":"07:00","close":"19:00"},"sun":{"open":"07:00","close":"18:00"}}',
    '{"instagram":"@paraisolunahuana","facebook":"ParaisoLunahuana"}'
),
(
    'b1000000-0000-0000-0000-000000000003',
    -12.9800, -76.1300,
    'Hacienda Viñedos s/n, Lunahuaná',
    '{"sat":{"open":"10:00","close":"17:00"},"sun":{"open":"10:00","close":"17:00"}}',
    '{"instagram":"@vinadelsolpe"}'
),
(
    'b1000000-0000-0000-0000-000000000004',
    -13.0800, -76.4700,
    'Malecón Grau 456, San Vicente de Cañete',
    '{"mon":{"open":"00:00","close":"23:59"},"tue":{"open":"00:00","close":"23:59"},"wed":{"open":"00:00","close":"23:59"},"thu":{"open":"00:00","close":"23:59"},"fri":{"open":"00:00","close":"23:59"},"sat":{"open":"00:00","close":"23:59"},"sun":{"open":"00:00","close":"23:59"}}',
    '{"instagram":"@hotellunacanete","facebook":"HotelLunaCanete","website":"https://hotelluna.pe"}'
)
ON CONFLICT (tenant_id) DO NOTHING;

-- =============================================================================
-- USUARIOS (hash BCrypt de "demo123" y "admin123")
-- BCrypt de "demo123" = $2a$12$K8CqoP0gkOBGJ7XcYiTKlOeHlJ9yg8L.H5iKZhiCN2nWQqHGPDnAi
-- BCrypt de "admin123" = $2a$12$HGzqxQHPjzXQ01Xq2XW0yO1dCvVE9eGJ4S6E0F7l8wdCBRqt3gPZi
-- NOTA: para producción usar hashes reales generados por BCryptPasswordEncoder
-- =============================================================================

INSERT INTO users (id, email, password_hash, full_name, role, tenant_id, tenant_slug, status)
VALUES
-- Admin global
(
    'c1000000-0000-0000-0000-000000000001',
    'admin@canete.app',
    '$2a$12$HGzqxQHPjzXQ01Xq2XW0yO1dCvVE9eGJ4S6E0F7l8wdCBRqt3gPZi',
    'Administrador Cañete',
    'admin', NULL, NULL, 'active'
),
-- Dueños de negocios
(
    'c1000000-0000-0000-0000-000000000002',
    'muelle@demo.com',
    '$2a$12$K8CqoP0gkOBGJ7XcYiTKlOeHlJ9yg8L.H5iKZhiCN2nWQqHGPDnAi',
    'Carlos Ramos',
    'business_owner',
    'b1000000-0000-0000-0000-000000000001',
    'muelle-pacifico', 'active'
),
(
    'c1000000-0000-0000-0000-000000000003',
    'paraiso@demo.com',
    '$2a$12$K8CqoP0gkOBGJ7XcYiTKlOeHlJ9yg8L.H5iKZhiCN2nWQqHGPDnAi',
    'Ana Torres',
    'business_owner',
    'b1000000-0000-0000-0000-000000000002',
    'paraiso-lunahuana', 'active'
),
(
    'c1000000-0000-0000-0000-000000000004',
    'vina@demo.com',
    '$2a$12$K8CqoP0gkOBGJ7XcYiTKlOeHlJ9yg8L.H5iKZhiCN2nWQqHGPDnAi',
    'Luis Mendoza',
    'business_owner',
    'b1000000-0000-0000-0000-000000000003',
    'vina-del-sol', 'active'
),
(
    'c1000000-0000-0000-0000-000000000005',
    'hotel@demo.com',
    '$2a$12$K8CqoP0gkOBGJ7XcYiTKlOeHlJ9yg8L.H5iKZhiCN2nWQqHGPDnAi',
    'María Castillo',
    'business_owner',
    'b1000000-0000-0000-0000-000000000004',
    'hotel-luna', 'active'
)
ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- PRODUCTOS — Muelle Pacifico
-- =============================================================================

INSERT INTO products (id, tenant_id, name, description, price, category, is_available, sort_order)
VALUES
('d1000000-0001-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Ceviche clásico',       'Leche de tigre, choclo, camote y cancha serrana', 38.00, 'Entradas',      true, 1),
('d1000000-0001-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'Jalea mixta',           'Mariscos y pescados fritos con tacu tacu',       52.00, 'Segundos',      true, 2),
('d1000000-0001-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'Arroz con mariscos',    'Arroz negro con calamares, langostinos y almejas',48.00, 'Segundos',      true, 3),
('d1000000-0001-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'Tiradito de lenguado',  'Lenguado fresco con leche de tigre verde',       42.00, 'Entradas',      true, 4),
('d1000000-0001-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'Chicha morada',         'Chicha morada artesanal con frutas',               8.00, 'Bebidas',       true, 10),
('d1000000-0001-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001', 'Causa rellena',         'Causa limeña con atún y palta',                  26.00, 'Entradas',      true, 5)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- PRODUCTOS — Viña del Sol
-- =============================================================================

INSERT INTO products (id, tenant_id, name, description, price, category, is_available, sort_order)
VALUES
('d1000000-0003-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'Quebranta Reserva 2022','Vino de uva quebranta, taninos suaves, 12 meses barrica', 85.00, 'Vinos tintos',  true, 1),
('d1000000-0003-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 'Mosto verde de Italia', 'Uva italia semiseca, notas florales y melocotón',         65.00, 'Vinos blancos', true, 2),
('d1000000-0003-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'Pisco Quebranta',       'Pisco puro de 42°, premiado en concurso nacional',        95.00, 'Piscos',        true, 3),
('d1000000-0003-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000003', 'Pack cata 3 vinos',     'Tres botellas de 375ml: tinto, blanco y rosado',         120.00, 'Packs',         true, 4)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- PRODUCTOS — Hotel Luna (servicios)
-- =============================================================================

INSERT INTO products (id, tenant_id, name, description, price, category, is_available, sort_order)
VALUES
('d1000000-0004-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004', 'Habitación estándar',    'Vista jardín, cama queen, A/C, wifi',       280.00, 'Habitaciones', true, 1),
('d1000000-0004-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', 'Habitación superior',    'Vista al mar, cama king, jacuzzi privado',  450.00, 'Habitaciones', true, 2),
('d1000000-0004-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000004', 'Suite presidencial',     'Terraza privada, sala de estar, butler 24h',850.00, 'Habitaciones', true, 3),
('d1000000-0004-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004', 'Masaje relajante 60 min','Aceites esenciales, técnica sueca',          120.00, 'Spa',          true, 10),
('d1000000-0004-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000004', 'Cena romántica',        'Mesa privada, menú de 4 tiempos, vista al mar',180.00,'Restaurante',  true, 11)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- CLIENTES de ejemplo
-- =============================================================================

INSERT INTO customers (id, tenant_id, full_name, email, phone, address, total_orders, total_spent)
VALUES
('e1000000-0001-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Pedro García',    'pedro@gmail.com',  '+51 999 111 001', 'Jr. Lima 234, San Vicente', 5, 310.00),
('e1000000-0001-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'Rosa Huamán',     'rosa@gmail.com',   '+51 999 111 002', 'Av. Grau 56, San Vicente',   3, 186.00),
('e1000000-0001-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'Jorge Quispe',    NULL,               '+51 999 111 003', 'Calle Real 78, San Vicente', 8, 524.00),
('e1000000-0003-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'Valeria Rosas',   'valeria@gmail.com','+51 999 333 001', 'Av. Sol 12, Lima',           4, 440.00),
('e1000000-0004-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004', 'Marco Delgado',   'marco@gmail.com',  '+51 999 444 001', 'Jr. Miraflores 99, Lima',    2, 900.00)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- ÓRDENES de ejemplo (Muelle Pacifico)
-- =============================================================================

INSERT INTO orders (id, tenant_id, customer_id, customer_name, customer_phone, customer_address,
                    status, payment_method, subtotal, delivery_fee, discount, total)
VALUES
(
    'f1000000-0001-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'e1000000-0001-0000-0000-000000000001',
    'Pedro García', '+51 999 111 001', 'Jr. Lima 234, San Vicente',
    'delivered', 'yape', 76.00, 8.00, 0, 84.00
),
(
    'f1000000-0001-0000-0000-000000000002',
    'b1000000-0000-0000-0000-000000000001',
    'e1000000-0001-0000-0000-000000000002',
    'Rosa Huamán', '+51 999 111 002', 'Av. Grau 56, San Vicente',
    'preparing', 'cash', 38.00, 8.00, 0, 46.00
),
(
    'f1000000-0001-0000-0000-000000000003',
    'b1000000-0000-0000-0000-000000000001',
    'e1000000-0001-0000-0000-000000000003',
    'Jorge Quispe', '+51 999 111 003', 'Calle Real 78, San Vicente',
    'pending', 'card', 90.00, 8.00, 0, 98.00
)
ON CONFLICT (id) DO NOTHING;

-- Order items
INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
VALUES
('f1000000-0001-0000-0000-000000000001','d1000000-0001-0000-0000-000000000001','Ceviche clásico', 38.00, 1, 38.00),
('f1000000-0001-0000-0000-000000000001','d1000000-0001-0000-0000-000000000002','Jalea mixta',      52.00, 1, 52.00),
('f1000000-0001-0000-0000-000000000002','d1000000-0001-0000-0000-000000000001','Ceviche clásico', 38.00, 1, 38.00),
('f1000000-0001-0000-0000-000000000003','d1000000-0001-0000-0000-000000000003','Arroz con mariscos',48.00,1,48.00),
('f1000000-0001-0000-0000-000000000003','d1000000-0001-0000-0000-000000000004','Tiradito de lenguado',42.00,1,42.00)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- RESERVAS de ejemplo
-- =============================================================================

INSERT INTO reservations (id, tenant_id, customer_id, customer_name, customer_phone,
                          service_type, guests, reservation_date, reservation_time,
                          status, subtotal, service_fee, total)
VALUES
(
    '11000000-0001-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'e1000000-0001-0000-0000-000000000001',
    'Pedro García', '+51 999 111 001',
    'table', 4, CURRENT_DATE + 2, '13:00:00', 'confirmed', 0, 0, 0
),
(
    '11000000-0002-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000002',
    NULL,
    'Sandra Flores', '+51 999 222 001',
    'rafting', 6, CURRENT_DATE + 5, '09:00:00', 'confirmed',
    534.00, 64.08, 598.08
),
(
    '11000000-0004-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000004',
    'e1000000-0004-0000-0000-000000000001',
    'Marco Delgado', '+51 999 444 001',
    'room', 2, CURRENT_DATE + 10, '15:00:00', 'confirmed',
    450.00, 0, 450.00
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- REVIEWS
-- =============================================================================

INSERT INTO reviews (id, tenant_id, customer_id, customer_name, rating, comment)
VALUES
('21000000-0001-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','e1000000-0001-0000-0000-000000000001','Pedro García',    5.0, 'El ceviche es espectacular, fresco y con la leche de tigre perfecta.'),
('21000000-0001-0000-0000-000000000002','b1000000-0000-0000-0000-000000000001','e1000000-0001-0000-0000-000000000002','Rosa Huamán',     4.5, 'Muy rico todo. La jalea mixta enorme. El servicio podría ser más rápido.'),
('21000000-0001-0000-0000-000000000003','b1000000-0000-0000-0000-000000000001',NULL,                                  'Juan Villanueva',  5.0, 'Mejor mariscos de Cañete, sin dudas.'),
('21000000-0002-0000-0000-000000000001','b1000000-0000-0000-0000-000000000002',NULL,                                  'Marcos Silva',    5.0, 'El rafting fue increíble! Los guías son muy profesionales.'),
('21000000-0002-0000-0000-000000000002','b1000000-0000-0000-0000-000000000002',NULL,                                  'Carla Jiménez',   4.5, 'Buena experiencia, el paisaje es precioso.'),
('21000000-0003-0000-0000-000000000001','b1000000-0000-0000-0000-000000000003','e1000000-0003-0000-0000-000000000001','Valeria Rosas',   4.5, 'El Quebranta Reserva es excelente, notas de cereza y vainilla.'),
('21000000-0004-0000-0000-000000000001','b1000000-0000-0000-0000-000000000004','e1000000-0004-0000-0000-000000000001','Marco Delgado',   5.0, 'El hotel es un paraíso. La habitación superior con vista al mar, increíble.')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- CUPONES de ejemplo
-- =============================================================================

INSERT INTO coupons (id, tenant_id, code, type, value, min_order, max_uses, valid_from, valid_until, is_active)
VALUES
('31000000-0001-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','BIENVENIDO10','percentage',10.00, 0.00, 100, CURRENT_DATE, CURRENT_DATE + 90, true),
('31000000-0001-0000-0000-000000000002','b1000000-0000-0000-0000-000000000001','DELIVERY0',   'fixed',      8.00,30.00,  50, CURRENT_DATE, CURRENT_DATE + 30, true),
('31000000-0003-0000-0000-000000000001','b1000000-0000-0000-0000-000000000003','VINO20',      'percentage', 20.00,80.00,  30, CURRENT_DATE, CURRENT_DATE + 60, true)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- CAMPAÑAS de ejemplo
-- =============================================================================

INSERT INTO campaigns (id, tenant_id, name, type, status, subject, recipient_count, open_rate, sent_at)
VALUES
(
    '41000000-0001-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'Promo Día de la Madre',
    'email', 'sent',
    '🌸 Celebra el Día de la Madre con nosotros — 15% off',
    245, 38.2,
    now() - INTERVAL '15 days'
),
(
    '41000000-0003-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000003',
    'Lanzamiento Cosecha 2024',
    'email', 'sent',
    '🍷 Ya llegó nuestra nueva cosecha — descúbrela',
    120, 44.0,
    now() - INTERVAL '7 days'
),
(
    '41000000-0004-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000004',
    'Fiestas Patrias — Paquete especial',
    'email', 'scheduled',
    '🇵🇪 Paquete Fiestas Patrias: 2 noches + desayuno + spa',
    380, 0,
    NULL
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- ANALYTICS HISTÓRICO (últimas 4 semanas)
-- =============================================================================

INSERT INTO analytics_daily (tenant_id, date, revenue, orders, reservations, new_customers, avg_ticket)
VALUES
-- Global
(NULL, CURRENT_DATE - 21, 7200,  180, 42, 12, 40.0),
(NULL, CURRENT_DATE - 14, 8100,  204, 51, 15, 39.7),
(NULL, CURRENT_DATE - 7,  9400,  235, 59, 18, 40.0),
(NULL, CURRENT_DATE,     11200,  281, 74, 22, 39.9),
-- Muelle Pacifico
('b1000000-0000-0000-0000-000000000001', CURRENT_DATE - 21, 2800, 70, 12, 4, 40.0),
('b1000000-0000-0000-0000-000000000001', CURRENT_DATE - 14, 3100, 78, 14, 5, 39.7),
('b1000000-0000-0000-0000-000000000001', CURRENT_DATE - 7,  3600, 90, 16, 6, 40.0),
('b1000000-0000-0000-0000-000000000001', CURRENT_DATE,      4200, 105,20, 8, 40.0),
-- Hotel Luna
('b1000000-0000-0000-0000-000000000004', CURRENT_DATE - 21, 2200,  20, 18, 3, 110.0),
('b1000000-0000-0000-0000-000000000004', CURRENT_DATE - 14, 2600,  24, 22, 4, 108.3),
('b1000000-0000-0000-0000-000000000004', CURRENT_DATE - 7,  3100,  28, 25, 4, 110.7),
('b1000000-0000-0000-0000-000000000004', CURRENT_DATE,      3800,  34, 31, 5, 111.8)
ON CONFLICT ON CONSTRAINT analytics_daily_tenant_id_date_key DO NOTHING;
