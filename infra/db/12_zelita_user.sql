-- Migration 12: Create business_owner user for Zelita (alfajores) tenant
-- The tenant existed but had no login user.
-- Password: demo123 (BCrypt hash strength 10, matching BCryptPasswordEncoder default)

SET search_path TO canete_marketplace, public;

INSERT INTO users (email, password_hash, full_name, role, tenant_id, tenant_slug, status)
SELECT
    'zelita@demo.com',
    '$2a$10$EDgHQJwoL2SiVxvmjdNzmeXEHiuVTqkX2UZy8ZNwzYC9HMem0YhmC',
    'Zelita Admin',
    'business_owner',
    id,
    slug,
    'active'
FROM tenants
WHERE slug = 'alfajores'
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    full_name      = EXCLUDED.full_name,
    role           = EXCLUDED.role,
    tenant_id      = EXCLUDED.tenant_id,
    tenant_slug    = EXCLUDED.tenant_slug,
    status         = EXCLUDED.status,
    updated_at     = now();
