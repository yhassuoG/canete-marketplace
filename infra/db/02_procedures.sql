-- =============================================================================
-- Cañete Marketplace — Stored Procedures, Functions & Triggers
-- Archivo: 02_procedures.sql
-- Ejecutar después de 01_schema.sql
-- =============================================================================

SET search_path TO canete_marketplace, public;

-- =============================================================================
-- TRIGGER: recalcular rating del tenant al agregar/eliminar review
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_recalculate_tenant_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_avg    NUMERIC(3,2);
    v_count  INT;
BEGIN
    SELECT
        ROUND(AVG(rating)::NUMERIC, 2),
        COUNT(*)
    INTO v_avg, v_count
    FROM reviews
    WHERE tenant_id = COALESCE(NEW.tenant_id, OLD.tenant_id)
      AND is_visible = true;

    UPDATE tenants
    SET rating       = COALESCE(v_avg, 0),
        review_count = v_count
    WHERE id = COALESCE(NEW.tenant_id, OLD.tenant_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reviews_recalculate_rating ON reviews;
CREATE TRIGGER trg_reviews_recalculate_rating
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION fn_recalculate_tenant_rating();

-- =============================================================================
-- TRIGGER: actualizar stats del tenant al completar una orden
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_update_tenant_order_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Cuando una orden pasa a 'delivered', actualizar totales del tenant
    IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
        UPDATE tenants
        SET orders_this_month   = orders_this_month + 1,
            monthly_revenue     = monthly_revenue + NEW.total
        WHERE id = NEW.tenant_id;

        -- Actualizar stats del cliente si existe
        IF NEW.customer_id IS NOT NULL THEN
            UPDATE customers
            SET total_orders = total_orders + 1,
                total_spent  = total_spent + NEW.total
            WHERE id = NEW.customer_id;
        END IF;
    END IF;

    -- Si una orden entregada se cancela, revertir
    IF NEW.status = 'cancelled' AND OLD.status = 'delivered' THEN
        UPDATE tenants
        SET orders_this_month = GREATEST(0, orders_this_month - 1),
            monthly_revenue   = GREATEST(0, monthly_revenue - OLD.total)
        WHERE id = NEW.tenant_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_update_tenant_stats ON orders;
CREATE TRIGGER trg_orders_update_tenant_stats
    AFTER UPDATE OF status ON orders
    FOR EACH ROW EXECUTE FUNCTION fn_update_tenant_order_stats();

-- =============================================================================
-- TRIGGER: actualizar stats del tenant al completar una reserva
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_update_tenant_reservation_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
        UPDATE tenants
        SET reservations_this_month = reservations_this_month + 1
        WHERE id = NEW.tenant_id;
    END IF;

    IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
        UPDATE tenants
        SET reservations_this_month = GREATEST(0, reservations_this_month - 1)
        WHERE id = NEW.tenant_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reservations_update_stats ON reservations;
CREATE TRIGGER trg_reservations_update_stats
    AFTER UPDATE OF status ON reservations
    FOR EACH ROW EXECUTE FUNCTION fn_update_tenant_reservation_stats();

-- =============================================================================
-- SP: sp_create_order
-- Crea una orden completa con sus items en una transacción.
-- Devuelve el id de la orden creada.
-- =============================================================================

CREATE OR REPLACE FUNCTION sp_create_order(
    p_tenant_id      UUID,
    p_customer_name  VARCHAR,
    p_customer_phone VARCHAR,
    p_address        TEXT,
    p_payment_method payment_method,
    p_notes          TEXT,
    p_items          JSONB,      -- [{"product_id": "uuid|null", "name": "...", "price": 10.0, "qty": 2}]
    p_coupon_code    VARCHAR     -- NULL si no hay cupón
)
RETURNS UUID AS $$
DECLARE
    v_order_id      UUID;
    v_subtotal      NUMERIC(10,2) := 0;
    v_delivery_fee  NUMERIC(10,2) := 5.00;
    v_discount      NUMERIC(10,2) := 0;
    v_total         NUMERIC(10,2);
    v_coupon_id     UUID;
    v_coupon        RECORD;
    v_item          JSONB;
    v_item_subtotal NUMERIC(10,2);
BEGIN
    -- Calcular subtotal
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_subtotal := v_subtotal + ((v_item->>'price')::NUMERIC * (v_item->>'qty')::INT);
    END LOOP;

    -- Validar y aplicar cupón
    IF p_coupon_code IS NOT NULL THEN
        SELECT * INTO v_coupon
        FROM coupons
        WHERE tenant_id = p_tenant_id
          AND code      = p_coupon_code
          AND is_active = true
          AND valid_from  <= CURRENT_DATE
          AND valid_until >= CURRENT_DATE
          AND (max_uses IS NULL OR used_count < max_uses)
          AND v_subtotal >= min_order
        FOR UPDATE;

        IF FOUND THEN
            v_coupon_id := v_coupon.id;
            IF v_coupon.type = 'percentage' THEN
                v_discount := ROUND(v_subtotal * v_coupon.value / 100, 2);
            ELSE
                v_discount := LEAST(v_coupon.value, v_subtotal);
            END IF;

            UPDATE coupons SET used_count = used_count + 1 WHERE id = v_coupon_id;
        END IF;
    END IF;

    v_total := v_subtotal + v_delivery_fee - v_discount;

    -- Crear orden
    INSERT INTO orders (
        tenant_id, customer_name, customer_phone, customer_address,
        status, payment_method, subtotal, delivery_fee, discount, total,
        coupon_id, notes
    )
    VALUES (
        p_tenant_id, p_customer_name, p_customer_phone, p_address,
        'pending', p_payment_method, v_subtotal, v_delivery_fee, v_discount, v_total,
        v_coupon_id, p_notes
    )
    RETURNING id INTO v_order_id;

    -- Insertar items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_subtotal := (v_item->>'price')::NUMERIC * (v_item->>'qty')::INT;
        INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
        VALUES (
            v_order_id,
            NULLIF(v_item->>'product_id', '')::UUID,
            v_item->>'name',
            (v_item->>'price')::NUMERIC,
            (v_item->>'qty')::INT,
            v_item_subtotal
        );
    END LOOP;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SP: sp_validate_coupon
-- Valida un cupón y devuelve el descuento calculado (0 si no aplica).
-- =============================================================================

CREATE OR REPLACE FUNCTION sp_validate_coupon(
    p_tenant_id   UUID,
    p_code        VARCHAR,
    p_order_total NUMERIC
)
RETURNS TABLE (
    is_valid    BOOLEAN,
    coupon_id   UUID,
    type        TEXT,
    value       NUMERIC,
    discount    NUMERIC,
    reason      TEXT
) AS $$
DECLARE
    v_coupon RECORD;
BEGIN
    SELECT * INTO v_coupon
    FROM coupons
    WHERE tenant_id    = p_tenant_id
      AND code         = p_code
      AND is_active    = true
      AND valid_from  <= CURRENT_DATE
      AND valid_until >= CURRENT_DATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 0::NUMERIC, 0::NUMERIC, 'Cupón no válido o expirado';
        RETURN;
    END IF;

    IF p_order_total < v_coupon.min_order THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 0::NUMERIC, 0::NUMERIC,
            format('Mínimo de pedido: S/ %s', v_coupon.min_order);
        RETURN;
    END IF;

    IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 0::NUMERIC, 0::NUMERIC, 'Cupón agotado';
        RETURN;
    END IF;

    RETURN QUERY SELECT
        true,
        v_coupon.id,
        v_coupon.type::TEXT,
        v_coupon.value,
        CASE v_coupon.type
            WHEN 'percentage' THEN ROUND(p_order_total * v_coupon.value / 100, 2)
            ELSE LEAST(v_coupon.value, p_order_total)
        END,
        'OK'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SP: sp_get_tenant_dashboard
-- Devuelve un resumen completo para el dashboard de un tenant.
-- =============================================================================

CREATE OR REPLACE FUNCTION sp_get_tenant_dashboard(p_slug VARCHAR)
RETURNS TABLE (
    tenant_id               UUID,
    name                    TEXT,
    plan                    TEXT,
    status                  TEXT,
    rating                  NUMERIC,
    review_count            INT,
    total_sales             NUMERIC,
    sales_growth            NUMERIC,
    total_reservations      BIGINT,
    total_orders            BIGINT,
    total_customers         BIGINT,
    pending_orders          BIGINT,
    revenue_last_7_days     NUMERIC,
    revenue_prev_7_days     NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.name::TEXT,
        p.name::TEXT,
        t.status::TEXT,
        t.rating,
        t.review_count,
        COALESCE(SUM(o.total) FILTER (WHERE o.status != 'cancelled'), 0)       AS total_sales,
        0::NUMERIC                                                               AS sales_growth,
        COUNT(DISTINCT r.id) FILTER (WHERE r.status != 'cancelled')             AS total_reservations,
        COUNT(DISTINCT o.id) FILTER (WHERE o.status != 'cancelled')             AS total_orders,
        COUNT(DISTINCT c.id)                                                     AS total_customers,
        COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'pending')                AS pending_orders,
        COALESCE(SUM(o.total) FILTER (
            WHERE o.status != 'cancelled'
              AND o.created_at >= now() - INTERVAL '7 days'), 0)                AS revenue_last_7_days,
        COALESCE(SUM(o.total) FILTER (
            WHERE o.status != 'cancelled'
              AND o.created_at >= now() - INTERVAL '14 days'
              AND o.created_at < now() - INTERVAL '7 days'), 0)                 AS revenue_prev_7_days
    FROM tenants t
    LEFT JOIN plans p ON p.id = t.plan_id
    LEFT JOIN orders o ON o.tenant_id = t.id
    LEFT JOIN reservations r ON r.tenant_id = t.id
    LEFT JOIN customers c ON c.tenant_id = t.id
    WHERE t.slug = p_slug
    GROUP BY t.id, t.name, p.name, t.status, t.rating, t.review_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SP: sp_get_revenue_series
-- Serie temporal de ingresos para gráficos (últimas N semanas).
-- =============================================================================

CREATE OR REPLACE FUNCTION sp_get_revenue_series(
    p_tenant_id UUID,     -- NULL = global
    p_weeks     INT DEFAULT 4
)
RETURNS TABLE (
    period_start  DATE,
    revenue       NUMERIC,
    orders        BIGINT,
    reservations  BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH weeks AS (
        SELECT generate_series(
            date_trunc('week', now() - ((p_weeks - 1) || ' weeks')::INTERVAL)::DATE,
            date_trunc('week', now())::DATE,
            '1 week'::INTERVAL
        )::DATE AS week_start
    )
    SELECT
        w.week_start,
        COALESCE(SUM(o.total)   FILTER (WHERE o.status != 'cancelled'), 0),
        COUNT(DISTINCT o.id)    FILTER (WHERE o.status != 'cancelled'),
        COUNT(DISTINCT r.id)    FILTER (WHERE r.status != 'cancelled')
    FROM weeks w
    LEFT JOIN orders o ON
        o.created_at >= w.week_start
        AND o.created_at < w.week_start + INTERVAL '1 week'
        AND (p_tenant_id IS NULL OR o.tenant_id = p_tenant_id)
    LEFT JOIN reservations r ON
        r.created_at >= w.week_start
        AND r.created_at < w.week_start + INTERVAL '1 week'
        AND (p_tenant_id IS NULL OR r.tenant_id = p_tenant_id)
    GROUP BY w.week_start
    ORDER BY w.week_start;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SP: sp_register_customer
-- Upsert de cliente (por tenant + email o teléfono).
-- Devuelve el id del cliente.
-- =============================================================================

CREATE OR REPLACE FUNCTION sp_register_customer(
    p_tenant_id UUID,
    p_full_name  VARCHAR,
    p_email      VARCHAR DEFAULT NULL,
    p_phone      VARCHAR DEFAULT NULL,
    p_address    TEXT    DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_customer_id UUID;
BEGIN
    -- Intentar encontrar por email
    IF p_email IS NOT NULL THEN
        SELECT id INTO v_customer_id
        FROM customers
        WHERE tenant_id = p_tenant_id AND email = p_email;
    END IF;

    -- Intentar encontrar por teléfono si no se encontró por email
    IF v_customer_id IS NULL AND p_phone IS NOT NULL THEN
        SELECT id INTO v_customer_id
        FROM customers
        WHERE tenant_id = p_tenant_id AND phone = p_phone
        LIMIT 1;
    END IF;

    IF v_customer_id IS NULL THEN
        INSERT INTO customers (tenant_id, full_name, email, phone, address)
        VALUES (p_tenant_id, p_full_name, p_email, p_phone, p_address)
        RETURNING id INTO v_customer_id;
    ELSE
        UPDATE customers
        SET full_name  = p_full_name,
            phone      = COALESCE(p_phone, phone),
            address    = COALESCE(p_address, address)
        WHERE id = v_customer_id;
    END IF;

    RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SP: sp_aggregate_daily_analytics
-- Agrega métricas del día anterior. Llamar con pg_cron o manualmente.
-- =============================================================================

CREATE OR REPLACE FUNCTION sp_aggregate_daily_analytics(p_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS VOID AS $$
BEGIN
    -- Por tenant
    INSERT INTO analytics_daily (tenant_id, date, revenue, orders, reservations, new_customers, avg_ticket)
    SELECT
        t.id,
        p_date,
        COALESCE(SUM(o.total) FILTER (WHERE o.status != 'cancelled'), 0),
        COUNT(DISTINCT o.id)  FILTER (WHERE o.status != 'cancelled'),
        COUNT(DISTINCT r.id)  FILTER (WHERE r.status != 'cancelled'),
        COUNT(DISTINCT c.id)  FILTER (WHERE c.created_at::DATE = p_date),
        CASE WHEN COUNT(o.id) FILTER (WHERE o.status != 'cancelled') > 0
             THEN ROUND(SUM(o.total) FILTER (WHERE o.status != 'cancelled') /
                  COUNT(o.id) FILTER (WHERE o.status != 'cancelled'), 2)
             ELSE 0 END
    FROM tenants t
    LEFT JOIN orders o ON o.tenant_id = t.id AND o.created_at::DATE = p_date
    LEFT JOIN reservations r ON r.tenant_id = t.id AND r.created_at::DATE = p_date
    LEFT JOIN customers c ON c.tenant_id = t.id
    GROUP BY t.id
    ON CONFLICT (tenant_id, date)
    DO UPDATE SET
        revenue       = EXCLUDED.revenue,
        orders        = EXCLUDED.orders,
        reservations  = EXCLUDED.reservations,
        new_customers = EXCLUDED.new_customers,
        avg_ticket    = EXCLUDED.avg_ticket;

    -- Global (tenant_id = NULL)
    INSERT INTO analytics_daily (tenant_id, date, revenue, orders, reservations, new_customers, avg_ticket)
    SELECT
        NULL,
        p_date,
        COALESCE(SUM(o.total) FILTER (WHERE o.status != 'cancelled'), 0),
        COUNT(DISTINCT o.id)  FILTER (WHERE o.status != 'cancelled'),
        COUNT(DISTINCT r.id)  FILTER (WHERE r.status != 'cancelled'),
        (SELECT COUNT(*) FROM customers WHERE created_at::DATE = p_date),
        CASE WHEN COUNT(o.id) FILTER (WHERE o.status != 'cancelled') > 0
             THEN ROUND(SUM(o.total) FILTER (WHERE o.status != 'cancelled') /
                  COUNT(o.id) FILTER (WHERE o.status != 'cancelled'), 2)
             ELSE 0 END
    FROM orders o
    LEFT JOIN reservations r ON r.created_at::DATE = p_date
    WHERE o.created_at::DATE = p_date
    ON CONFLICT ON CONSTRAINT analytics_daily_tenant_id_date_key
    DO UPDATE SET
        revenue       = EXCLUDED.revenue,
        orders        = EXCLUDED.orders,
        reservations  = EXCLUDED.reservations,
        new_customers = EXCLUDED.new_customers,
        avg_ticket    = EXCLUDED.avg_ticket;
END;
$$ LANGUAGE plpgsql;
