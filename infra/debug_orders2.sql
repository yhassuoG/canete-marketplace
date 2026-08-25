\timing off

\echo '=== ORDERS for tenant eecfd498 (with customer details) ==='
SELECT o.id, o.customer_id, o.customer_name, o.customer_phone, o.status, o.total, o.created_at
FROM canete_marketplace.orders o
WHERE o.tenant_id = 'eecfd498-1c5b-4096-864a-1b4bd4a61200'
ORDER BY o.created_at DESC;

\echo '=== CUSTOMERS for tenant eecfd498 ==='
SELECT id, full_name, email, phone, account_id, google_sub, total_orders, total_spent
FROM canete_marketplace.customers
WHERE tenant_id = 'eecfd498-1c5b-4096-864a-1b4bd4a61200'
ORDER BY created_at DESC;

\echo '=== ALL MARKETPLACE ACCOUNTS ==='
SELECT id, email, full_name, google_sub
FROM canete_marketplace.marketplace_accounts
ORDER BY created_at DESC;

\echo '=== ALL CUSTOMERS (with account_id) ==='
SELECT id, full_name, email, phone, account_id, tenant_id
FROM canete_marketplace.customers
WHERE account_id IS NOT NULL
ORDER BY created_at DESC;
