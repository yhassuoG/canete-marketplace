SET search_path TO canete_marketplace, public;
SELECT t.slug, t.name, tc.yape_enabled, tc.plin_enabled, tc.yape_phone, tc.yape_qr_url
FROM tenants t
JOIN tenant_config tc ON tc.tenant_id = t.id
ORDER BY t.name;
