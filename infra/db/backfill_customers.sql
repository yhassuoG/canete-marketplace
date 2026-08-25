INSERT INTO canete_marketplace.customers (tenant_id, full_name, phone, total_orders, total_spent, loyalty_points, created_at, updated_at)
SELECT o.tenant_id, o.customer_name, o.customer_phone, 1, o.total, o.total::int, o.created_at, o.created_at
FROM canete_marketplace.orders o
JOIN canete_marketplace.tenants t ON o.tenant_id = t.id
WHERE t.slug = 'makis'
  AND o.customer_phone IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM canete_marketplace.customers c
    WHERE c.tenant_id = o.tenant_id AND c.phone = o.customer_phone
  );
