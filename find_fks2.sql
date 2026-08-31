SET search_path TO canete_marketplace;
-- Find FKs between child tables to determine delete order
SELECT tc.table_name AS child_table, kcu.column_name AS fk_column, ccu.table_name AS parent_table
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('analytics_daily','campaigns','coupons','customers','invoices','orders','products','reservations','reviews','rewards','tenant_config','tenant_subscriptions','tenant_tax_config','users')
  AND ccu.table_name IN ('analytics_daily','campaigns','coupons','customers','invoices','orders','products','reservations','reviews','rewards','tenant_config','tenant_subscriptions','tenant_tax_config','users','tenants')
ORDER BY tc.table_name;
