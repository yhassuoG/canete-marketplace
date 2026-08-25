\timing off

\echo '=== CUSTOMERS columns ==='
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'canete_marketplace' AND table_name = 'customers'
ORDER BY ordinal_position;

\echo '=== MARKETPLACE_ACCOUNTS columns ==='
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'canete_marketplace' AND table_name = 'marketplace_accounts'
ORDER BY ordinal_position;

\echo '=== ORDERS columns ==='
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'canete_marketplace' AND table_name = 'orders'
ORDER BY ordinal_position;
