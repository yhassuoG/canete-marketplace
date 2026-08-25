SELECT id, tenant_id, customer_name, status, total, delivery_type, created_at
FROM canete_marketplace.orders
WHERE tenant_id = 'eecfd498-1c5b-4096-864a-1b4bd4a61200'
ORDER BY created_at DESC;
