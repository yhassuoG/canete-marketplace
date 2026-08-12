-- =============================================================================
-- Cañete Marketplace — Multi-tenant Mercado Pago + Plans/Trial system
-- Archivo: 14_multi_tenant_mp_and_plans.sql
--
-- Cambios:
-- 1. Agregar planes 'free' y 'trial' al enum plan_name
-- 2. Agregar campos a plans: trial_days, has_mp, max_mp_sales_month
-- 3. Agregar campos MP a tenant_config (credenciales por tenant)
-- 4. Crear tabla tenant_subscriptions (tracking de trial, pagos mensuales)
-- 5. Seed de los 5 planes: FREE, TRIAL, STARTER, PRO, ENTERPRISE
-- =============================================================================

SET search_path TO canete_marketplace, public;

-- =============================================================================
-- 1. Planes 'free' y 'trial' (plan_name era enum pero se convirtió a VARCHAR en migración 05)
--    No se necesita ALTER TYPE porque plans.name ya es VARCHAR(20).
-- =============================================================================

-- =============================================================================
-- 2. Agregar campos a plans para trial y MP
-- =============================================================================

ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS trial_days          INT  NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS has_mp              BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS max_mp_sales_month  INT  NOT NULL DEFAULT -1,  -- -1 = ilimitado
    ADD COLUMN IF NOT EXISTS is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS sort_order          INT  NOT NULL DEFAULT 0;

COMMENT ON COLUMN plans.trial_days         IS 'Días de prueba gratis (0 = sin trial). Solo aplica al plan TRIAL.';
COMMENT ON COLUMN plans.has_mp             IS 'Si el plan incluye pasarela Mercado Pago automatizada.';
COMMENT ON COLUMN plans.max_mp_sales_month IS 'Máximo ventas con MP por mes (-1 = ilimitado, 0 = sin MP).';
COMMENT ON COLUMN plans.is_active          IS 'Si el plan está disponible para nuevas suscripciones.';
COMMENT ON COLUMN plans.sort_order         IS 'Orden de展示 en pricing page (0=free, 1=trial, 2=starter...).';

-- =============================================================================
-- 3. Agregar campos de Mercado Pago a tenant_config
--    Cada tenant configura SUS PROPIAS credenciales de MP.
--    El dinero va directo a la cuenta MP del tenant.
-- =============================================================================

ALTER TABLE tenant_config
    ADD COLUMN IF NOT EXISTS mp_access_token   VARCHAR(200),
    ADD COLUMN IF NOT EXISTS mp_public_key     VARCHAR(200),
    ADD COLUMN IF NOT EXISTS mp_user_id        VARCHAR(50),
    ADD COLUMN IF NOT EXISTS mp_sandbox        BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS mp_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS mp_updated_at     TIMESTAMPTZ;

COMMENT ON COLUMN tenant_config.mp_access_token IS 'Access token de Mercado Pago del tenant (APP_USR-... o TEST-...).';
COMMENT ON COLUMN tenant_config.mp_public_key   IS 'Public key de Mercado Pago del tenant.';
COMMENT ON COLUMN tenant_config.mp_user_id      IS 'User ID de MP del tenant (para validar webhook).';
COMMENT ON COLUMN tenant_config.mp_sandbox      IS 'Si el tenant está en modo sandbox (testing).';
COMMENT ON COLUMN tenant_config.mp_enabled      IS 'Si el tenant ha configurado MP y está activo.';
COMMENT ON COLUMN tenant_config.mp_updated_at   IS 'Última actualización de credenciales MP.';

-- =============================================================================
-- 4. Tabla tenant_subscriptions — tracking de trial, pagos mensuales
--    Una suscripción por tenant (1:1). Registra:
--    - plan_actual (free, starter, pro, enterprise)
--    - trial: fecha_inicio, fecha_fin, usado
--    - suscripción paga: fecha_inicio, fecha_renovacion, estado
--    - contador de ventas con MP este mes (para límites del plan)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID         NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    -- Plan actual (free, starter, pro, enterprise). 'trial' es temporal.
    current_plan        VARCHAR(20) NOT NULL DEFAULT 'trial',
    -- Trial tracking
    trial_started_at    TIMESTAMPTZ,
    trial_ends_at       TIMESTAMPTZ,
    trial_used          BOOLEAN      NOT NULL DEFAULT FALSE,
    -- Suscripción paga (cuando current_plan != 'free' y != 'trial')
    subscription_started_at  TIMESTAMPTZ,
    subscription_renewal_at  TIMESTAMPTZ,  -- próxima fecha de cobro
    subscription_status     VARCHAR(20) NOT NULL DEFAULT 'none',  -- none, active, past_due, cancelled
    -- Contador de ventas con MP este mes (para límites del plan)
    mp_sales_this_month     INT          NOT NULL DEFAULT 0,
    mp_sales_reset_at       TIMESTAMPTZ,  -- cuándo se resetó el contador por última vez
    -- Metadata
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    -- Constraints
    CONSTRAINT chk_subscription_status CHECK (
        subscription_status IN ('none', 'active', 'past_due', 'cancelled')
    )
);

CREATE INDEX IF NOT EXISTS idx_tenant_sub_tenant  ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_sub_plan    ON tenant_subscriptions(current_plan);
CREATE INDEX IF NOT EXISTS idx_tenant_sub_renewal ON tenant_subscriptions(subscription_renewal_at);

CREATE TRIGGER trg_tenant_sub_updated_at
    BEFORE UPDATE ON tenant_subscriptions
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- =============================================================================
-- 5. SEED — Los 5 planes del modelo de negocio
--    FREE     → S/0,  10 ventas MP/mes, sin trial
--    TRIAL    → S/0,  14 días ilimitado (plan temporal, no se suscribe directamente)
--    STARTER  → S/49, ilimitado
--    PRO      → S/99, ilimitado
--    ENTERPRISE → S/199, ilimitado
-- =============================================================================

-- Eliminar planes seed anteriores y re-insertar con nuevos campos
DELETE FROM plans WHERE id IN (
    'a1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000003'
);

INSERT INTO plans (
    id, name, display_name, price_monthly, max_products, max_orders_per_month,
    trial_days, has_mp, max_mp_sales_month, is_active, sort_order, features
) VALUES
    -- FREE: gratis, 10 ventas con MP/mes, 20 productos
    ('a1000000-0000-0000-0000-000000000000', 'free',
     'Gratis', 0.00, 20, 100,
     0, TRUE, 10, TRUE, 0,
     ARRAY['catalog', 'mp_manual']),

    -- TRIAL: 14 días gratis con todo desbloqueado (plan temporal)
    ('a1000000-0000-0000-0000-000000000004', 'trial',
     'Prueba 14 días', 0.00, -1, -1,
     14, TRUE, -1, TRUE, 1,
     ARRAY['catalog', 'delivery', 'mp_auto', 'reservations', 'reviews']),

    -- STARTER: S/49/mes, ilimitado
    ('a1000000-0000-0000-0000-000000000001', 'starter',
     'Starter', 49.00, 100, -1,
     0, TRUE, -1, TRUE, 2,
     ARRAY['catalog', 'delivery', 'mp_auto', 'reviews']),

    -- PRO: S/99/mes
    ('a1000000-0000-0000-0000-000000000002', 'premium',
     'Pro', 99.00, 500, -1,
     0, TRUE, -1, TRUE, 3,
     ARRAY['catalog', 'delivery', 'mp_auto', 'reservations', 'reviews', 'loyalty', 'campaigns']),

    -- ENTERPRISE: S/199/mes
    ('a1000000-0000-0000-0000-000000000003', 'enterprise',
     'Enterprise', 199.00, -1, -1,
     0, TRUE, -1, TRUE, 4,
     ARRAY['catalog', 'delivery', 'mp_auto', 'reservations', 'reviews', 'loyalty', 'campaigns', 'tickets', 'api_access'])
ON CONFLICT (name) DO UPDATE SET
    display_name       = EXCLUDED.display_name,
    price_monthly      = EXCLUDED.price_monthly,
    max_products       = EXCLUDED.max_products,
    max_orders_per_month = EXCLUDED.max_orders_per_month,
    trial_days         = EXCLUDED.trial_days,
    has_mp             = EXCLUDED.has_mp,
    max_mp_sales_month = EXCLUDED.max_mp_sales_month,
    is_active          = EXCLUDED.is_active,
    sort_order         = EXCLUDED.sort_order,
    features           = EXCLUDED.features,
    updated_at         = now();

-- =============================================================================
-- 6. Crear suscripciones para tenants existentes (por defecto: trial 14 días)
--    Esto inicializa el tracking de trial para todos los tenants ya creados.
-- =============================================================================

INSERT INTO tenant_subscriptions (tenant_id, current_plan, trial_started_at, trial_ends_at, trial_used, subscription_status)
SELECT
    t.id,
    'trial',
    now(),
    now() + INTERVAL '14 days',
    FALSE,
    'none'
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM tenant_subscriptions ts WHERE ts.tenant_id = t.id
)
ON CONFLICT (tenant_id) DO NOTHING;

-- =============================================================================
-- DONE
-- =============================================================================

-- Verificación (opcional, solo log)
DO $$
BEGIN
    RAISE NOTICE 'Migración 14 completada. Planes disponibles:';
    RAISE NOTICE '  - free:      S/0,  10 ventas MP/mes';
    RAISE NOTICE '  - trial:     14 días gratis, ilimitado';
    RAISE NOTICE '  - starter:   S/49/mes, ilimitado';
    RAISE NOTICE '  - premium:   S/99/mes, ilimitado';
    RAISE NOTICE '  - enterprise: S/199/mes, ilimitado';
END $$;
