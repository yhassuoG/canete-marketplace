\timing off

\echo '=== FKs referencing customers ==='
SELECT conname, conrelid::regclass AS child_table, confrelid::regclass AS parent_table
FROM pg_constraint
WHERE confrelid = 'canete_marketplace.customers'::regclass
  AND contype = 'f';

\echo '=== FKs from customers to other tables ==='
SELECT conname, conrelid::regclass AS child_table, confrelid::regclass AS parent_table
FROM pg_constraint
WHERE conrelid = 'canete_marketplace.customers'::regclass
  AND contype = 'f';

\echo '=== fn_recalculate_tenant_rating source ==='
SELECT pg_get_functiondef('canete_marketplace.fn_recalculate_tenant_rating()'::regprocedure);
