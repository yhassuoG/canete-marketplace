#!/bin/bash
set -e
cd /mnt/d/proyecto/services/api/src/main/resources/db
echo "Aplicando migraciones a canete_marketplace..."
for f in 01_schema.sql 02_procedures.sql 03_seed.sql 04_fix_enum_casts.sql 05_enums_to_varchar.sql 06_fix_enums_complete.sql 07_fix_enums_v2.sql 08_marketplace_accounts.sql; do
  echo "=== $f ==="
  PGPASSWORD=postgres psql -U postgres -h localhost -d canete_marketplace -f "$f" 2>&1 | tail -3 || echo "  (continuando)"
done
echo "Migraciones completadas."
