-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 20: Add Google OAuth columns to customers table
--
-- CustomerEntity maps avatar_url and google_sub but they were never added
-- to the production schema. This causes 500 errors when the backend tries
-- to SELECT these columns during Google login flow.
-- ─────────────────────────────────────────────────────────────────────────────

SET search_path TO canete_marketplace, public;

-- avatar_url: Google profile picture URL
ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- google_sub: Google's unique subject identifier (sub claim)
-- Not UNIQUE because a person can be a customer in multiple tenants
-- (uniqueness is handled at the marketplace_accounts level)
ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS google_sub VARCHAR(200);

-- Index for fast look-up by Google sub within a tenant
CREATE INDEX IF NOT EXISTS idx_customers_google_sub ON customers(tenant_id, google_sub);
