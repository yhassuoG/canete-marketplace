-- ============================================================
-- 22_yape_plin_payment_proofs.sql
-- Yape/Plin nativo (sin Mercado Pago) + comprobantes de pago
-- ============================================================
SET search_path TO canete_marketplace, public;

-- ── 1. tenant_config: Plin + enable flags + holder names + instrucciones ──
ALTER TABLE tenant_config ADD COLUMN IF NOT EXISTS yape_enabled   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tenant_config ADD COLUMN IF NOT EXISTS yape_holder    VARCHAR(120);
ALTER TABLE tenant_config ADD COLUMN IF NOT EXISTS plin_enabled   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tenant_config ADD COLUMN IF NOT EXISTS plin_phone     VARCHAR(20);
ALTER TABLE tenant_config ADD COLUMN IF NOT EXISTS plin_holder    VARCHAR(120);
ALTER TABLE tenant_config ADD COLUMN IF NOT EXISTS plin_qr_url    VARCHAR(500);
ALTER TABLE tenant_config ADD COLUMN IF NOT EXISTS payment_instructions TEXT;

-- ── 2. orders: payment_status + payment_receipt_url ──
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status      VARCHAR(40);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_verified_by  UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_verified_at  TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_rejected_at  TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_rejected_by  UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_rejection_reason TEXT;

-- ── 3. plans: has_yape / has_plin (per-plan gating, default TRUE) ──
ALTER TABLE plans ADD COLUMN IF NOT EXISTS has_yape BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS has_plin BOOLEAN NOT NULL DEFAULT TRUE;

-- ── 4. payment_proofs: comprobantes de pago (historial/auditoría) ──
CREATE TABLE IF NOT EXISTS payment_proofs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL,
    customer_id     UUID,
    payment_method  VARCHAR(20)  NOT NULL,   -- yape | plin
    file_url        TEXT         NOT NULL,
    file_name       VARCHAR(255),
    file_size       BIGINT,
    status          VARCHAR(40)  NOT NULL DEFAULT 'PENDING_VERIFICATION',
    rejection_reason TEXT,
    uploaded_by     VARCHAR(120),            -- customer name (audit)
    verified_by     UUID,                    -- user who confirmed/rejected
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_proofs_order   ON payment_proofs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_tenant  ON payment_proofs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status  ON payment_proofs(status);

-- ── 5. Backfill: orders existentes con yape/plin nativo quedan con payment_status ──
UPDATE orders
   SET payment_status = CASE
        WHEN status IN ('pending_payment','pending') AND payment_method IN ('yape','plin') THEN 'PENDING_VERIFICATION'
        WHEN status = 'confirmed' AND payment_method IN ('yape','plin') THEN 'APPROVED'
        WHEN status = 'payment_rejected' THEN 'REJECTED'
        ELSE NULL
   END
 WHERE payment_status IS NULL
   AND payment_method IN ('yape','plin');
