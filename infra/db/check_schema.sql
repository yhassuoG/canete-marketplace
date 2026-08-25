SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%tenant%' OR table_name LIKE '%config%' ORDER BY table_name;
SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%order%' ORDER BY table_name;
