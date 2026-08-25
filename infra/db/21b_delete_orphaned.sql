-- Delete orphaned guest customers, temporarily disabling the broken trigger
BEGIN;

-- Disable the broken trigger on reviews (references non-existent unqualified table)
ALTER TABLE canete_marketplace.reviews DISABLE TRIGGER trg_reviews_recalculate_rating;

DELETE FROM canete_marketplace.customers c
WHERE c.account_id IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM canete_marketplace.orders o WHERE o.customer_id = c.id
  );

-- Re-enable
ALTER TABLE canete_marketplace.reviews ENABLE TRIGGER trg_reviews_recalculate_rating;

COMMIT;
