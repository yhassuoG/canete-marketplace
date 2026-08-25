\timing off
SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgrelid = 'canete_marketplace.reviews'::regclass;
