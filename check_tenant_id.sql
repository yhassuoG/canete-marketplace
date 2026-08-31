SET search_path TO canete_marketplace;
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'canete_marketplace'
  AND table_name IN ('order_items', 'invoice_items', 'orders', 'invoices', 'reservations', 'reviews', 'customers', 'products', 'coupons', 'campaigns', 'analytics_daily', 'rewards', 'users', 'tenant_config', 'tenant_subscriptions', 'tenant_tax_config')
  AND column_name = 'tenant_id'
ORDER BY table_name;
