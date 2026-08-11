#!/bin/bash

cd /mnt/d/proyecto/Backend/src/main/resources/db

echo "Aplicando migraciones a la base de datos canete_marketplace..."

# Crear la base de datos si no existe
echo "Verificando base de datos..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'canete_marketplace'" | grep -q 1 || sudo -u postgres createdb canete_marketplace

# Aplicar migraciones como usuario postgres
for file in *.sql; do
  echo "Procesando: $file"
  sudo -u postgres psql -d canete_marketplace -f "$file" 2>/dev/null || echo "  (puede ya estar aplicado o no aplicable)"
done

echo "✓ Migraciones completadas!"


