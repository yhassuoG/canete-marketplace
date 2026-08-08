#!/bin/bash

echo "Iniciando servicios de base de datos en WSL..."

# Iniciar PostgreSQL
echo "Iniciando PostgreSQL..."
sudo service postgresql start > /dev/null 2>&1

# Crear base de datos si no existe
echo "Configurando base de datos..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'canete_marketplace'" | grep -q 1 || sudo -u postgres createdb canete_marketplace

# Iniciar Redis
echo "Iniciando Redis..."
sudo service redis-server start > /dev/null 2>&1

echo "✓ PostgreSQL iniciado en localhost:5432"
echo "✓ Redis iniciado en localhost:6379"
echo "✓ Base de datos 'canete_marketplace' lista"

# Mantener el script ejecutándose
echo ""
echo "Servicios en ejecución. Presiona Ctrl+C para detener."
sleep infinity

