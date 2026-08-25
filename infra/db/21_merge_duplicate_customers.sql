-- =============================================================================
-- 21_merge_duplicate_customers.sql
-- Merge guest customers that share a phone with a logged-in customer.
-- Sets order.customer_id to the logged-in customer, recalculates totals,
-- and deletes the duplicate guest customer records.
-- =============================================================================

BEGIN;

-- For each (tenant_id, phone) where a logged-in customer exists,
-- re-link all guest orders to the logged-in customer.
UPDATE canete_marketplace.orders o
SET customer_id = lc.id
FROM canete_marketplace.customers lc
WHERE o.customer_id IS NULL
  AND o.customer_phone IS NOT NULL
  AND o.customer_phone = lc.phone
  AND o.tenant_id = lc.tenant_id
  AND lc.account_id IS NOT NULL;

-- Recalculate total_orders and total_spent for all customers that have
-- orders linked to them (including the newly re-linked ones).
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

-- Delete guest customers (no account_id) that have NO orders linked to them
-- (their orders were re-linked to the logged-in customer).
DELETE FROM canete_marketplace.customers c
WHERE c.account_id IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM canete_marketplace.orders o WHERE o.customer_id = c.id
  );

COMMIT;
