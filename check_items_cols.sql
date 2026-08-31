SET search_path TO canete_marketplace;
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'canete_marketplace'
  AND table_name IN ('order_items', 'invoice_items')
ORDER BY table_name, ordinal_position;
