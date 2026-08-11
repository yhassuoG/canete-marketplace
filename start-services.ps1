# Script para iniciar todos los servicios en Windows y WSL

Write-Host "Iniciando servicios para el proyecto..." -ForegroundColor Green

# 1. Iniciar PostgreSQL y Redis en WSL
Write-Host "`nIniciando PostgreSQL y Redis en WSL..." -ForegroundColor Yellow
wsl -e bash -c "sudo service postgresql start"
wsl -e bash -c "sudo service redis-server start"

Write-Host "Servicios iniciados en WSL" -ForegroundColor Green

# 2. Crear base de datos si no existe
Write-Host "`nConfigurando base de datos PostgreSQL..." -ForegroundColor Yellow
wsl -e bash -c "sudo -u postgres psql -c 'CREATE DATABASE canete_marketplace;' 2>/dev/null || true"

# 3. Aplicar migraciones de base de datos
Write-Host "Aplicando migraciones..." -ForegroundColor Yellow
cd D:\proyecto\Backend
mvn clean compile

Write-Host "`nTodos los servicios están listos!" -ForegroundColor Green
Write-Host "Próximo paso: Ejecutar los servidores en terminales separadas" -ForegroundColor Cyan

