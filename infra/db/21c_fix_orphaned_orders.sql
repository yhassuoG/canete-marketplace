-- Create customer records for orders that have NULL customer_id
-- (these are guests that were accidentally orphaned)
BEGIN;

-- Insert customer for Miguel's order
INSERT INTO canete_marketplace.customers (id, tenant_id, full_name, phone, total_orders, total_spent, loyalty_points)
SELECT
    gen_random_uuid(),
    o.tenant_id,
    o.customer_name,
    o.customer_phone,
    1,
    o.total,
    o.total::integer
FROM canete_marketplace.orders o
WHERE o.id = 'f2b4c250-7aac-46b5-a3e1-fb5772b40c92'
  AND NOT EXISTS (
      SELECT 1 FROM canete_marketplace.customers c
      WHERE c.tenant_id = o.tenant_id AND c.phone = o.customer_phone
  );

-- Link Miguel's order to the new customer
UPDATE canete_marketplace.orders o
SET customer_id = c.id
FROM canete_marketplace.customers c
WHERE o.id = 'f2b4c250-7aac-46b5-a3e1-fb5772b40c92'
  AND o.customer_id IS NULL
  AND c.tenant_id = o.tenant_id
  AND c.phone = o.customer_phone;

-- For the other orphaned order (f151b6a8, "Yhulios Yhassuo", phone 961710933, different tenant)
-- Check if there's already a logged-in customer for that phone in that tenant
-- If not, create a guest customer
INSERT INTO canete_marketplace.customers (id, tenant_id, full_name, phone, total_orders, total_spent, loyalty_points)
SELECT
    gen_random_uuid(),
    o.tenant_id,
    o.customer_name,
    o.customer_phone,
    1,
    o.total,
    o.total::integer
FROM canete_marketplace.orders o
WHERE o.id = 'f151b6a8-7ec5-43ff-961b-6ed5c063bb75'
  AND NOT EXISTS (
      SELECT 1 FROM canete_marketplace.customers c
      WHERE c.tenant_id = o.tenant_id AND c.phone = o.customer_phone
  );

-- Link that order to the customer
UPDATE canete_marketplace.orders o
SET customer_id = c.id
FROM canete_marketplace.customers c
WHERE o.id = 'f151b6a8-7ec5-43ff-961b-6ed5c063bb75'
  AND o.customer_id IS NULL
  AND c.tenant_id = o.tenant_id
  AND c.phone = o.customer_phone;

COMMIT;
