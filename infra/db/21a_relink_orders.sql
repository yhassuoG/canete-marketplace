-- Step 1: Re-link guest orders to logged-in customers by phone
BEGIN;
UPDATE canete_marketplace.orders o
SET customer_id = lc.id
FROM canete_marketplace.customers lc
WHERE o.customer_id IS NULL
  AND o.customer_phone IS NOT NULL
  AND o.customer_phone = lc.phone
  AND o.tenant_id = lc.tenant_id
  AND lc.account_id IS NOT NULL;
COMMIT;

-- Step 2: Recalculate totals for all customers
BEGIN;
UPDATE canete_marketplace.customers c
SET total_orders = sub.cnt,
    total_spent  = sub.spent,
    loyalty_points = sub.spent::integer
FROM (
    SELECT customer_id, COUNT(*) AS cnt, COALESCE(SUM(total), 0) AS spent
    FROM canete_marketplace.orders
    WHERE customer_id IS NOT NULL
    GROUP BY customer_id
) sub
WHERE c.id = sub.customer_id;
COMMIT;
