-- Add cash_enabled and card_enabled columns to tenant_config
-- cash_enabled defaults to true (most businesses accept cash)
-- card_enabled defaults to false (requires Mercado Pago setup)

ALTER TABLE tenant_config ADD COLUMN IF NOT EXISTS cash_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE tenant_config ADD COLUMN IF NOT EXISTS card_enabled BOOLEAN NOT NULL DEFAULT false;
