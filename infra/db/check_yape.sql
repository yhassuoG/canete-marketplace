SELECT count(*) AS yape_enabled_exists FROM information_schema.columns WHERE table_name='tenant_config' AND column_name='yape_enabled';
SELECT count(*) AS payment_proofs_exists FROM information_schema.tables WHERE table_name='payment_proofs';
SELECT slug, yape_enabled, plin_enabled FROM tenant_config LIMIT 5;
