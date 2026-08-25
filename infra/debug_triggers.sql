\timing off
SELECT tgname, tgrelid::regclass, tgtype FROM pg_trigger WHERE tgrelid = 'canete_marketplace.customers'::regclass;
