-- =============================================================================
-- Cañete Marketplace — Schema PostgreSQL
-- Archivo: 01_schema.sql
-- Base de datos: canete_marketplace  |  Esquema: canete_marketplace
-- Ejecutar primero. Idempotente (CREATE IF NOT EXISTS).
-- =============================================================================

-- Esquema principal
CREATE SCHEMA IF NOT EXISTS canete_marketplace;
SET search_path TO canete_marketplace, public;

-- Extensiones (deben estar en public)
CREATE EXTENSION IF NOT EXISTS "pgcrypto"  SCHEMA public;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "unaccent"  SCHEMA public;   -- búsquedas sin tilde

-- =============================================================================
-- ENUMS
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE tenant_status  AS ENUM ('active', 'suspended', 'trial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE tenant_category AS ENUM ('restaurant', 'hotel', 'experience', 'winery', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE plan_name AS ENUM ('starter', 'premium', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'business_owner', 'customer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'suspended', 'pending_verification');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'card', 'yape', 'plin', 'transfer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'completed', 'no_show', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE campaign_type AS ENUM ('email', 'sms', 'push', 'whatsapp');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'sent', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- FUNCIÓN HELPER: updated_at automático
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TABLA: plans
-- =============================================================================

CREATE TABLE IF NOT EXISTS plans (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name            plan_name    NOT NULL UNIQUE,
    display_name    VARCHAR(60)  NOT NULL,
    price_monthly   NUMERIC(10,2) NOT NULL DEFAULT 0,
    max_products    INT          NOT NULL DEFAULT 50,
    max_orders_per_month INT     NOT NULL DEFAULT 500,
    features        TEXT[]       NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- =============================================================================
-- TABLA: tenants
-- =============================================================================

CREATE TABLE IF NOT EXISTS tenants (
    id              UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(80)      NOT NULL UNIQUE,
    name            VARCHAR(120)     NOT NULL,
    tagline         VARCHAR(255),
    description     TEXT,
    category        tenant_category  NOT NULL DEFAULT 'other',
    location        VARCHAR(200),
    phone           VARCHAR(30),
    primary_color   VARCHAR(20)      NOT NULL DEFAULT '#0c4a6e',
    gradient        VARCHAR(200),
    plan_id         UUID             REFERENCES plans(id) ON DELETE SET NULL,
    status          tenant_status    NOT NULL DEFAULT 'active',
    rating          NUMERIC(3,2)     NOT NULL DEFAULT 0.00 CHECK (rating BETWEEN 0 AND 5),
    review_count    INT              NOT NULL DEFAULT 0 CHECK (review_count >= 0),
    monthly_revenue NUMERIC(12,2)    NOT NULL DEFAULT 0,
    reservations_this_month INT      NOT NULL DEFAULT 0,
    orders_this_month       INT      NOT NULL DEFAULT 0,
    features        TEXT[]           NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ      NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug   ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

CREATE TRIGGER trg_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- =============================================================================
-- TABLA: tenant_config  (ubicación, horarios, redes sociales)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tenant_config (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID        NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    lat           NUMERIC(10,7),
    lng           NUMERIC(10,7),
    address       VARCHAR(255),
    opening_hours JSONB       DEFAULT '{}',   -- {"mon":{"open":"08:00","close":"22:00"}, ...}
    social_links  JSONB       DEFAULT '{}',   -- {"facebook":"url","instagram":"url"}
    banner_url    VARCHAR(500),
    logo_url      VARCHAR(500),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_tenant_config_updated_at
    BEFORE UPDATE ON tenant_config
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- =============================================================================
-- TABLA: users
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(200) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(120) NOT NULL,
    role            user_role    NOT NULL DEFAULT 'customer',
    tenant_id       UUID        REFERENCES tenants(id) ON DELETE SET NULL,
    tenant_slug     VARCHAR(80),
    status          user_status  NOT NULL DEFAULT 'active',
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id   ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_role        ON users(role);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- =============================================================================
-- TABLA: products  (catálogo de cada tenant)
-- =============================================================================

CREATE TABLE IF NOT EXISTS products (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name          VARCHAR(200) NOT NULL,
    description   TEXT,
    price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    category      VARCHAR(100),
    image_url     VARCHAR(500),
    is_available  BOOLEAN      NOT NULL DEFAULT true,
    stock         INT          CHECK (stock IS NULL OR stock >= 0),  -- NULL = sin límite
    sort_order    INT          NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_tenant_id    ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_available    ON products(tenant_id, is_available);

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- =============================================================================
-- TABLA: customers  (clientes finales por tenant)
-- =============================================================================

CREATE TABLE IF NOT EXISTS customers (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    full_name      VARCHAR(120) NOT NULL,
    email          VARCHAR(200),
    phone          VARCHAR(30),
    address        TEXT,
    total_orders   INT          NOT NULL DEFAULT 0,
    total_spent    NUMERIC(12,2) NOT NULL DEFAULT 0,
    loyalty_points INT          NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone     ON customers(tenant_id, phone);

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- =============================================================================
-- TABLA: coupons
-- =============================================================================

CREATE TABLE IF NOT EXISTS coupons (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code        VARCHAR(50)  NOT NULL,
    type        coupon_type  NOT NULL DEFAULT 'percentage',
    value       NUMERIC(10,2) NOT NULL CHECK (value > 0),
    min_order   NUMERIC(10,2) NOT NULL DEFAULT 0,
    max_uses    INT,                        -- NULL = ilimitado
    used_count  INT          NOT NULL DEFAULT 0,
    valid_from  DATE         NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE         NOT NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_coupons_tenant_id ON coupons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code      ON coupons(tenant_id, code);

-- =============================================================================
-- TABLA: orders
-- =============================================================================

CREATE TABLE IF NOT EXISTS orders (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID           NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    customer_id      UUID           REFERENCES customers(id) ON DELETE SET NULL,
    customer_name    VARCHAR(120)   NOT NULL,
    customer_phone   VARCHAR(30),
    customer_address TEXT,
    status           order_status   NOT NULL DEFAULT 'pending',
    payment_method   payment_method,
    subtotal         NUMERIC(10,2)  NOT NULL CHECK (subtotal >= 0),
    delivery_fee     NUMERIC(10,2)  NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
    discount         NUMERIC(10,2)  NOT NULL DEFAULT 0 CHECK (discount >= 0),
    total            NUMERIC(10,2)  NOT NULL CHECK (total >= 0),
    coupon_id        UUID           REFERENCES coupons(id) ON DELETE SET NULL,
    notes            TEXT,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    delivered_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_tenant_id  ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer   ON orders(customer_id);

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- =============================================================================
-- TABLA: order_items
-- =============================================================================

CREATE TABLE IF NOT EXISTS order_items (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id     UUID         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id   UUID         REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    unit_price   NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    quantity     INT          NOT NULL DEFAULT 1 CHECK (quantity > 0),
    subtotal     NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- =============================================================================
-- TABLA: reservations
-- =============================================================================

CREATE TABLE IF NOT EXISTS reservations (
    id               UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID                NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    customer_id      UUID                REFERENCES customers(id) ON DELETE SET NULL,
    customer_name    VARCHAR(120)        NOT NULL,
    customer_email   VARCHAR(200),
    customer_phone   VARCHAR(30),
    service_type       VARCHAR(80)         NOT NULL DEFAULT 'experience',
    guests             INT                 NOT NULL DEFAULT 1 CHECK (guests > 0),
    reservation_date   DATE                NOT NULL,
    reservation_time   TIME,
    status             reservation_status  NOT NULL DEFAULT 'pending',
    subtotal         NUMERIC(10,2)       NOT NULL CHECK (subtotal >= 0),
    service_fee      NUMERIC(10,2)       NOT NULL DEFAULT 0,
    total            NUMERIC(10,2)       NOT NULL CHECK (total >= 0),
    notes            TEXT,
    created_at       TIMESTAMPTZ         NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ         NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_tenant_id  ON reservations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status     ON reservations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_date       ON reservations(tenant_id, reservation_date);

CREATE TRIGGER trg_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- =============================================================================
-- TABLA: reviews
-- =============================================================================

CREATE TABLE IF NOT EXISTS reviews (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id     UUID         REFERENCES customers(id) ON DELETE SET NULL,
    customer_name   VARCHAR(120) NOT NULL,
    rating          NUMERIC(2,1) NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    is_visible      BOOLEAN      NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_tenant_id ON reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating    ON reviews(tenant_id, rating DESC);

-- =============================================================================
-- TABLA: campaigns
-- =============================================================================

CREATE TABLE IF NOT EXISTS campaigns (
    id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID            NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name             VARCHAR(200)    NOT NULL,
    type             campaign_type   NOT NULL DEFAULT 'email',
    status           campaign_status NOT NULL DEFAULT 'draft',
    subject          VARCHAR(300),
    body             TEXT,
    recipient_count  INT             NOT NULL DEFAULT 0,
    open_rate        NUMERIC(5,2)    NOT NULL DEFAULT 0,
    scheduled_at     TIMESTAMPTZ,
    sent_at          TIMESTAMPTZ,
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_id ON campaigns(tenant_id);

CREATE TRIGGER trg_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- =============================================================================
-- TABLA: analytics_daily  (métricas pre-agregadas por día)
-- =============================================================================

CREATE TABLE IF NOT EXISTS analytics_daily (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID         REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = global
    date            DATE         NOT NULL,
    revenue         NUMERIC(12,2) NOT NULL DEFAULT 0,
    orders          INT          NOT NULL DEFAULT 0,
    reservations    INT          NOT NULL DEFAULT 0,
    new_customers   INT          NOT NULL DEFAULT 0,
    avg_ticket      NUMERIC(10,2) NOT NULL DEFAULT 0,
    UNIQUE (tenant_id, date),
    UNIQUE NULLS NOT DISTINCT (tenant_id, date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_tenant ON analytics_daily(tenant_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_global ON analytics_daily(date DESC) WHERE tenant_id IS NULL;

-- =============================================================================
-- VISTAS
-- =============================================================================

-- Vista catálogo marketplace (usada por CatalogController)
CREATE OR REPLACE VIEW v_catalog_listings AS
SELECT
    t.id,
    t.slug          AS tenant_slug,
    t.name          AS business_name,
    t.category::TEXT,
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

-- Vista métricas por tenant (usada por dashboard)
CREATE OR REPLACE VIEW v_tenant_metrics AS
SELECT
    t.id,
    t.slug,
    t.name,
    t.rating,
    t.review_count,
    t.monthly_revenue,
    t.reservations_this_month,
    t.orders_this_month,
    COALESCE(o_count.total_orders, 0)        AS total_orders_all_time,
    COALESCE(o_count.total_revenue, 0)       AS total_revenue_all_time,
    COALESCE(r_count.total_reservations, 0)  AS total_reservations_all_time,
    COALESCE(c_count.total_customers, 0)     AS total_customers
FROM tenants t
LEFT JOIN (
    SELECT tenant_id,
           COUNT(*)                    AS total_orders,
           COALESCE(SUM(total), 0)     AS total_revenue
    FROM orders
    WHERE status NOT IN ('cancelled')
    GROUP BY tenant_id
) o_count ON o_count.tenant_id = t.id
LEFT JOIN (
    SELECT tenant_id, COUNT(*) AS total_reservations
    FROM reservations
    WHERE status NOT IN ('cancelled')
    GROUP BY tenant_id
) r_count ON r_count.tenant_id = t.id
LEFT JOIN (
    SELECT tenant_id, COUNT(*) AS total_customers
    FROM customers
    GROUP BY tenant_id
) c_count ON c_count.tenant_id = t.id;

-- Vista métricas globales (usada por AdminAnalyticsService)
CREATE OR REPLACE VIEW v_global_metrics AS
SELECT
    COUNT(DISTINCT t.id)                           AS total_companies,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'active') AS active_companies,
    COALESCE(SUM(o.total), 0)                      AS total_revenue,
    COUNT(DISTINCT o.id)                           AS total_transactions,
    CASE WHEN COUNT(o.id) > 0
         THEN ROUND(COALESCE(SUM(o.total), 0) / COUNT(o.id), 2)
         ELSE 0 END                                AS avg_ticket,
    COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'customer') AS total_users
FROM tenants t
LEFT JOIN orders o  ON o.tenant_id = t.id AND o.status != 'cancelled'
LEFT JOIN users u   ON u.tenant_id = t.id;
