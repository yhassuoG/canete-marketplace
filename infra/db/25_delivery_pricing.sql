-- ============================================================
-- Migration 25: Delivery Pricing System
-- ============================================================
-- Replaces the single flat delivery_fee with a flexible model:
--   - flat:       fixed fee (existing behavior, but now actually used)
--   - distance:   base fee + per_km rate (Haversine from store to customer)
--   - free:       always free delivery
-- Plus promotional rules:
--   - free_threshold:  free delivery when subtotal >= threshold (e.g. "free over S/.50")
--   - min_order:       minimum order amount for delivery
--   - max_distance_km: max delivery radius (reject orders beyond this)
-- ============================================================

ALTER TABLE tenant_config
    ADD COLUMN IF NOT EXISTS delivery_strategy VARCHAR(20) NOT NULL DEFAULT 'flat',
    ADD COLUMN IF NOT EXISTS delivery_base_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS delivery_per_km NUMERIC(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS delivery_free_threshold NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS delivery_min_order NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS delivery_max_distance_km NUMERIC(10,2);

-- Backfill: migrate existing delivery_fee into delivery_base_fee for 'flat' strategy
UPDATE tenant_config
   SET delivery_base_fee = COALESCE(delivery_fee, 0)
 WHERE delivery_base_fee = 0
   AND delivery_fee IS NOT NULL
   AND delivery_fee > 0;

-- Constraint: strategy must be one of the supported values
ALTER TABLE tenant_config
    DROP CONSTRAINT IF EXISTS chk_delivery_strategy;
ALTER TABLE tenant_config
    ADD CONSTRAINT chk_delivery_strategy
    CHECK (delivery_strategy IN ('flat', 'distance', 'free'));

COMMENT ON COLUMN tenant_config.delivery_strategy       IS 'Pricing strategy: flat | distance | free';
COMMENT ON COLUMN tenant_config.delivery_base_fee       IS 'Base fee (flat mode: the fee; distance mode: starting fee)';
COMMENT ON COLUMN tenant_config.delivery_per_km         IS 'Per-km charge (distance mode only)';
COMMENT ON COLUMN tenant_config.delivery_free_threshold IS 'Subtotal at or above which delivery is free (null = no promo)';
COMMENT ON COLUMN tenant_config.delivery_min_order      IS 'Minimum order subtotal required for delivery (null = no minimum)';
COMMENT ON COLUMN tenant_config.delivery_max_distance_km IS 'Max delivery radius in km (null = no limit)';
