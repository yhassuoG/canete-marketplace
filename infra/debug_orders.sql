-- Debug orders vs customers
\timing off

\echo '=== ORDERS (last 10) ==='
SELECT id, customer_id, tenant_id, status, total, created_at
FROM canete_marketplace.orders
ORDER BY created_at DESC LIMIT 10;

\echo '=== CUSTOMERS for tenant eecfd498 ==='
SELECT id, customer_name, customer_phone, customer_email, account_id, tenant_id
FROM canete_marketplace.customers
WHERE tenant_id = 'eecfd498-1c5b-4096-864a-1b4bd4a61200'
ORDER BY created_at DESC;

\echo '=== ALL CUSTOMERS (last 10) ==='
SELECT id, customer_name, customer_phone, customer_email, account_id, tenant_id
FROM canete_marketplace.customers
ORDER BY created_at DESC LIMIT 10;

\echo '=== MARKETPLACE ACCOUNTS ==='
SELECT id, email, name, google_sub
FROM canete_marketplace.marketplace_accounts
ORDER BY created_at DESC LIMIT 10;
