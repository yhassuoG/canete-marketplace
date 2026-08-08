-- =============================================================================
-- Cañete Marketplace — Migración enum → VARCHAR (v2, completa)
-- Archivo: 07_fix_enums_v2.sql
-- Incluye drop de trg_orders_update_tenant_stats que bloqueaba orders.status
-- =============================================================================

SET search_path TO canete_marketplace, public;

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. DROP vistas dependientes
-- ─────────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS v_catalog_listings;
DROP VIEW IF EXISTS v_global_metrics;
DROP VIEW IF EXISTS v_tenant_metrics;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. DROP triggers con cláusula OF column_name (bloquean ALTER COLUMN TYPE)
-- ─────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_orders_update_tenant_stats   ON orders;
DROP TRIGGER IF EXISTS trg_reservations_update_stats    ON reservations;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. DROP función sp_create_order que usa payment_method enum como parámetro
-- ─────────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS sp_create_order(UUID, VARCHAR, VARCHAR, TEXT, payment_method, TEXT, JSONB, VARCHAR);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ALTER TABLE: enum → VARCHAR
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE tenants
    ALTER COLUMN status   TYPE VARCHAR(20) USING status::text,
    ALTER COLUMN category TYPE VARCHAR(30) USING category::text;

ALTER TABLE plans
    ALTER COLUMN name TYPE VARCHAR(20) USING name::text;

ALTER TABLE users
    ALTER COLUMN role   TYPE VARCHAR(30) USING role::text,
    ALTER COLUMN status TYPE VARCHAR(20) USING status::text;

ALTER TABLE orders
    ALTER COLUMN status         TYPE VARCHAR(20) USING status::text,
    ALTER COLUMN payment_method TYPE VARCHAR(30) USING payment_method::text;

ALTER TABLE reservations
    ALTER COLUMN status TYPE VARCHAR(20) USING status::text;

ALTER TABLE coupons
    ALTER COLUMN type TYPE VARCHAR(20) USING type::text;

ALTER TABLE campaigns
    ALTER COLUMN type   TYPE VARCHAR(20) USING type::text,
    ALTER COLUMN status TYPE VARCHAR(20) USING status::text;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. DROP enum types con CASCADE
-- ─────────────────────────────────────────────────────────────────────────────
DROP TYPE IF EXISTS tenant_status      CASCADE;
DROP TYPE IF EXISTS tenant_category    CASCADE;
DROP TYPE IF EXISTS plan_name          CASCADE;
DROP TYPE IF EXISTS user_role          CASCADE;
DROP TYPE IF EXISTS user_status        CASCADE;
DROP TYPE IF EXISTS order_status       CASCADE;
DROP TYPE IF EXISTS payment_method     CASCADE;
DROP TYPE IF EXISTS reservation_status CASCADE;
DROP TYPE IF EXISTS coupon_type        CASCADE;
DROP TYPE IF EXISTS campaign_type      CASCADE;
DROP TYPE IF EXISTS campaign_status    CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. RECREAR vistas
-- ─────────────────────────────────────────────────────────────────────────────
CREATE VIEW v_catalog_listings AS
SELECT
    t.id,
    t.slug          AS tenant_slug,
    t.name          AS business_name,
    t.category,
    t.location      AS district,
    t.rating,
    t.review_count,
    'reservations' = ANY(t.features) AS reservable,
    'delivery'     = ANY(t.features) AS delivery_enabled,
    t.status,
    tc.lat,
    tc.lng,
    tc.address
FROM tenants t
LEFT JOIN tenant_config tc ON tc.tenant_id = t.id
WHERE t.status = 'active';

CREATE VIEW v_tenant_metrics AS
SELECT
    t.id, t.slug, t.name, t.rating, t.review_count,
    t.monthly_revenue, t.reservations_this_month, t.orders_this_month,
    COALESCE(o.total_orders,    0) AS total_orders_all_time,
    COALESCE(o.total_revenue,   0) AS total_revenue_all_time,
    COALESCE(r.total_reservations, 0) AS total_reservations_all_time,
    COALESCE(c.total_customers, 0) AS total_customers
FROM tenants t
LEFT JOIN (
    SELECT tenant_id, COUNT(*) AS total_orders, COALESCE(SUM(total), 0) AS total_revenue
    FROM orders WHERE status <> 'cancelled' GROUP BY tenant_id
) o ON o.tenant_id = t.id
LEFT JOIN (
    SELECT tenant_id, COUNT(*) AS total_reservations
    FROM reservations WHERE status <> 'cancelled' GROUP BY tenant_id
) r ON r.tenant_id = t.id
LEFT JOIN (
    SELECT tenant_id, COUNT(*) AS total_customers FROM customers GROUP BY tenant_id
) c ON c.tenant_id = t.id;

CREATE VIEW v_global_metrics AS
SELECT
    COUNT(DISTINCT t.id)                                    AS total_companies,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'active') AS active_companies,
    COALESCE(SUM(o.total), 0)                               AS total_revenue,
    COUNT(DISTINCT o.id)                                    AS total_transactions,
    CASE WHEN COUNT(o.id) > 0
         THEN ROUND(COALESCE(SUM(o.total), 0) / COUNT(o.id), 2)
         ELSE 0 END                                         AS avg_ticket,
    COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'customer') AS total_users
FROM tenants t
LEFT JOIN orders o ON o.tenant_id = t.id AND o.status <> 'cancelled'
LEFT JOIN users  u ON u.tenant_id = t.id;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. RECREAR triggers de negocio
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_update_tenant_order_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status <> 'delivered') THEN
        UPDATE tenants
        SET orders_this_month = orders_this_month + 1,
            monthly_revenue   = monthly_revenue + NEW.total
        WHERE id = NEW.tenant_id;

        IF NEW.customer_id IS NOT NULL THEN
            UPDATE customers
            SET total_orders = total_orders + 1,
                total_spent  = total_spent + NEW.total
            WHERE id = NEW.customer_id;
        END IF;
    END IF;

    IF NEW.status = 'cancelled' AND OLD.status = 'delivered' THEN
        UPDATE tenants
        SET orders_this_month = GREATEST(0, orders_this_month - 1),
            monthly_revenue   = GREATEST(0, monthly_revenue - OLD.total)
        WHERE id = NEW.tenant_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_update_tenant_stats
    AFTER UPDATE OF status ON orders
    FOR EACH ROW EXECUTE FUNCTION fn_update_tenant_order_stats();

CREATE OR REPLACE FUNCTION fn_update_tenant_reservation_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
        UPDATE tenants SET reservations_this_month = reservations_this_month + 1 WHERE id = NEW.tenant_id;
    END IF;
    IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
        UPDATE tenants SET reservations_this_month = GREATEST(0, reservations_this_month - 1) WHERE id = NEW.tenant_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reservations_update_stats
    AFTER UPDATE OF status ON reservations
    FOR EACH ROW EXECUTE FUNCTION fn_update_tenant_reservation_stats();

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. RECREAR sp_create_order con payment_method VARCHAR
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sp_create_order(
    p_tenant_id      UUID,
    p_customer_name  VARCHAR,
    p_customer_phone VARCHAR,
    p_address        TEXT,
    p_payment_method VARCHAR(30),
    p_notes          TEXT,
    p_items          JSONB,
    p_coupon_code    VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_order_id   UUID;
    v_subtotal   NUMERIC(10,2) := 0;
    v_discount   NUMERIC(10,2) := 0;
    v_total      NUMERIC(10,2);
    v_coupon_id  UUID;
    v_item       JSONB;
    v_unit_price NUMERIC(10,2);
    v_quantity   INT;
BEGIN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_unit_price := (v_item->>'unit_price')::NUMERIC;
        v_quantity   := (v_item->>'quantity')::INT;
        v_subtotal   := v_subtotal + (v_unit_price * v_quantity);
    END LOOP;

    IF p_coupon_code IS NOT NULL AND p_coupon_code <> '' THEN
        SELECT id INTO v_coupon_id
        FROM coupons
        WHERE tenant_id = p_tenant_id AND code = p_coupon_code
          AND is_active = true AND (expires_at IS NULL OR expires_at > now())
          AND (max_uses IS NULL OR uses_count < max_uses) AND minimum_order <= v_subtotal;

        IF v_coupon_id IS NOT NULL THEN
            SELECT CASE WHEN type = 'percentage'
                        THEN ROUND(v_subtotal * discount_value / 100, 2)
                        ELSE LEAST(discount_value, v_subtotal) END
            INTO v_discount FROM coupons WHERE id = v_coupon_id;
            UPDATE coupons SET uses_count = uses_count + 1 WHERE id = v_coupon_id;
        END IF;
    END IF;

    v_total := v_subtotal - v_discount;

    INSERT INTO orders (
        tenant_id, customer_name, customer_phone, customer_address,
        status, payment_method, subtotal, delivery_fee, discount, total, coupon_id, notes
    ) VALUES (
        p_tenant_id, p_customer_name, p_customer_phone, p_address,
        'pending', p_payment_method, v_subtotal, 0, v_discount, v_total, v_coupon_id, p_notes
    ) RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
        VALUES (
            v_order_id,
            (v_item->>'product_id')::UUID,
            v_item->>'product_name',
            (v_item->>'unit_price')::NUMERIC,
            (v_item->>'quantity')::INT,
            (v_item->>'unit_price')::NUMERIC * (v_item->>'quantity')::INT
        );
    END LOOP;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;

SELECT 'Listo: todas las columnas son VARCHAR, vistas y triggers recreados' AS resultado;
