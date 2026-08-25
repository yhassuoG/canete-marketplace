\timing off
\echo '=== ALL customers ==='
SELECT id, full_name, phone, account_id, total_orders, total_spent
FROM canete_marketplace.customers
ORDER BY created_at DESC;

\echo '=== Orders with NULL customer_id ==='
SELECT id, customer_name, customer_phone, status, total
FROM canete_marketplace.orders
WHERE customer_id IS NULL
ORDER BY created_at DESC;
