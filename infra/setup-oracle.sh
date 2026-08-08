#!/usr/bin/env bash
# =============================================================================
# setup-oracle.sh — Configuracion inicial del VPS (Oracle Cloud / Hetzner)
# =============================================================================
# Ejecutar UNA SOLA VEZ en el VPS como root (o con sudo):
#
#   curl -fsSL https://raw.githubusercontent.com/TU_USUARIO/canete/main/infra/setup-oracle.sh | bash
#
# o subirlo por scp y ejecutar:
#   scp infra/setup-oracle.sh ubuntu@VPS_IP:/tmp/
#   ssh ubuntu@VPS_IP "sudo bash /tmp/setup-oracle.sh"
#
# Hace:
#   1. Instala Docker + Docker Compose plugin
#   2. Abre puertos 80 y 443 en iptables (Oracle Cloud usa iptables ademas de VCN)
#   3. Crea usuario 'deploy' para GitHub Actions
#   4. Crea ~/.env con variables vacias para llenar
#   5. Clona el repo (opcional)
# =============================================================================
set -euo pipefail

echo "=== Canete Marketplace — Setup VPS ==="

# 1. Docker
if ! command -v docker &>/dev/null; then
  echo "[1/5] Instalando Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
else
  echo "[1/5] Docker ya instalado: $(docker --version)"
fi

# 2. Firewall — Oracle Cloud tiene iptables restrictivo por defecto
echo "[2/5] Abriendo puertos 80 y 443 en iptables..."
iptables -I INPUT 6 -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT 2>/dev/null || true
# Persistir reglas
if command -v netfilter-persistent &>/dev/null; then
  netfilter-persistent save
elif [ -d /etc/iptables ]; then
  iptables-save > /etc/iptables/rules.v4
fi

# 3. Usuario deploy para GitHub Actions (SSH key se agrega despues)
echo "[3/5] Creando usuario 'deploy'..."
if ! id -u deploy &>/dev/null; then
  useradd -m -s /bin/bash -G docker deploy
  echo "Usuario 'deploy' creado y agregado al grupo docker."
else
  echo "Usuario 'deploy' ya existe."
fi

# 4. Directorio del proyecto + .env template
echo "[4/5] Creando estructura y .env template..."
DEPLOY_DIR=/home/deploy/canete
mkdir -p "$DEPLOY_DIR"
cat > "$DEPLOY_DIR/.env" <<'EOF'
# === Variables de produccion — llenar con valores reales ===
PUBLIC_URL=https://CANETE_IP.sslip.io

# Base de datos
DB_USER=postgres
DB_PASSWORD=CAMBIAR_ESTA_PASSWORD

# JWT
JWT_SECRET=c4n3t3-m4rk3tpl4c3-pr0d-s3cr3t-k3y-2026-ch4ng3-m3

# Mercado Pago (produccion: APP_USR-... o ATKN-...)
MP_ACCESS_TOKEN=
MP_PUBLIC_KEY=
MP_SANDBOX=true

# WhatsApp (opcional, deshabilitado por defecto)
WHATSAPP_ENABLED=false
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
EOF
chown -R deploy:deploy "$DEPLOY_DIR"
echo "   .env creado en $DEPLOY_DIR/.env — editar con valores reales."

# 5. IP publica para referencia
echo "[5/5] Detectando IP publica..."
PUBLIC_IP=$(curl -s ifconfig.me || echo "DESCONOCIDA")
echo "   IP publica: $PUBLIC_IP"
echo "   URL temporal: https://$PUBLIC_IP.sslip.io"
echo ""
echo "=== Setup completo ==="
echo ""
echo "Proximos pasos:"
echo "  1. Editar $DEPLOY_DIR/.env con tus credenciales de MP"
echo "  2. Cambiar PUBLIC_URL a https://$PUBLIC_IP.sslip.io"
echo "  3. En Caddyfile, cambiar 'canete.sslip.io' por '$PUBLIC_IP.sslip.io'"
echo "  4. Clonar repo y hacer: docker compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "Para GitHub Actions CD:"
echo "  - Agregar SSH key publica del deploy a /home/deploy/.ssh/authorized_keys"
echo "  - Configurar secrets en GitHub: VPS_HOST, VPS_USER, VPS_SSH_KEY"
