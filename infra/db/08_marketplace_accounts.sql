-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 08: Global marketplace accounts
--
-- Separates the global identity (one account per person) from the per-tenant
-- customer subscription (one customers row per account-tenant pair).
-- ─────────────────────────────────────────────────────────────────────────────

SET search_path TO canete_marketplace, public;

-- 1. Global account table (one per real person)
CREATE TABLE IF NOT EXISTS marketplace_accounts (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    google_sub  VARCHAR(200) UNIQUE,
    email       VARCHAR(255) NOT NULL,
    full_name   VARCHAR(255) NOT NULL,
    avatar_url  TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP
);

-- 2. Link existing customers to a future account via google_sub
--    (nullable FK — legacy seed data has no account)
ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS account_id UUID
        REFERENCES marketplace_accounts(id) ON DELETE SET NULL;

-- 3. Index for fast subscription look-up
CREATE INDEX IF NOT EXISTS idx_customers_account_id ON customers(account_id);

-- 4. Drop the UNIQUE constraint on customers.google_sub
--    With the new model a person can be a customer in multiple tenants,
--    so google_sub is no longer unique per customers row.
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_google_sub_key;
