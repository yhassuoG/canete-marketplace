# 🚀 Guía de Despliegue — Hetzner Cloud (€4.59/mes)

Stack completo desplegado en VPS con HTTPS automático (Let's Encrypt, gratis).

**VPS**: Hetzner CX23 — 2 vCPU AMD, 4GB RAM, 40GB NVMe, Falkenstein
**IP**: `178.105.116.195`
**URL**: `https://178.105.116.195.sslip.io`

## Arquitectura

```
Internet → Caddy (80/443, HTTPS auto) → web:3000 (Next.js)
                                    → api:8080 (Spring Boot)
                                          ↓
                                    postgres:5432 + redis:6379
```

| Servicio | Tecnología | Puerto |
|----------|-----------|--------|
| Proxy + HTTPS | Caddy 2 | 80, 443 |
| Frontend | Next.js 15 + React 19 | 3000 (interno) |
| Backend | Spring Boot 3.4 + Java 21 | 8080 (interno) |
| Base datos | PostgreSQL 16 | 5432 (interno) |
| Cache | Redis 7 | 6379 (interno) |

---

## Paso 1: Crear cuenta Hetzner Cloud

1. Ir a **https://console.hetzner.cloud** → registrarse
2. Verificar tarjeta de crédito
3. Crear proyecto: `canete-prod`
4. Crear servidor:
   - **Location**: Falkenstein (fsn1)
   - **Image**: Ubuntu 22.04
   - **Type**: CX23 (x86, 2 vCPU, 4GB RAM) — €4.59/mes
   - **Authentication**: Root password (Hetzner envía por email)
5. Anotar la IP pública: `178.105.116.195`

## Paso 2: Configurar el VPS

✅ **Ya completado** — Docker instalado, usuario `deploy` creado, SSH key generada.

```bash
# Conectar como root (admin)
ssh root@178.105.116.195

# Conectar como deploy (GitHub Actions usa este)
ssh deploy@178.105.116.195
```

Lo que se hizo en el VPS:
- Docker 29.7.2 instalado via get.docker.com
- Usuario `deploy` creado y agregado al grupo `docker`
- Clave SSH ed25519 generada en `/home/deploy/.ssh/canete_deploy_key`
- Clave pública agregada a `authorized_keys`
- Firewall: Hetzner no bloquea puertos (no requiere configuración)

## Paso 3: Configurar GitHub Secrets

En tu repo: **Settings → Secrets and variables → Actions → New secret**

| Secret | Valor |
|--------|-------|
| `VPS_HOST` | `178.105.116.195` |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Clave privada de `infra/vps-ssh-key.txt` |
| `DEPLOY_PATH` | `/home/deploy/canete` |
| `JWT_SECRET` | Tu secreto JWT (ej: `c4n3t3-pr0d-...`) |
| `DB_PASSWORD` | Password de postgres (cambiar del default) |
| `MP_ACCESS_TOKEN` | Token de Mercado Pago producción |
| `MP_PUBLIC_KEY` | Public key de Mercado Pago producción |
| `MP_SANDBOX` | `false` (producción) o `true` (homologación) |

> **Nota**: La clave privada está en `infra/vps-ssh-key.txt` (no commitear al repo).
> Agrégala a `.gitignore` o bórrala después de configurar GitHub Secrets.

## Paso 4: Deploy automático

Cada `push` a `main` dispara el workflow `.github/workflows/deploy-vps.yml`:

1. Sincroniza archivos al VPS por `rsync`
2. Escribe `.env` con los secrets
3. Ejecuta `docker compose -f docker-compose.prod.yml up -d --build`
4. Health check en `https://178.105.116.195.sslip.io`

**Primer deploy**: haz un push a main y revisa la pestaña Actions.

```bash
git add .
git commit -m "feat: add production deployment (Hetzner Cloud)"
git push origin main
```

## Paso 5: Verificar

```bash
# Frontend
curl -k https://178.105.116.195.sslip.io

# API health
curl -k https://178.105.116.195.sslip.io/api/v1/actuator/health

# Ver logs en el VPS
ssh deploy@178.105.116.195
cd /home/deploy/canete
docker compose -f docker-compose.prod.yml logs -f --tail=50
```

---

## Comandos útiles en el VPS

```bash
cd /home/deploy/canete

# Ver estado
docker compose -f docker-compose.prod.yml ps

# Logs en vivo
docker compose -f docker-compose.prod.yml logs -f api    # solo backend
docker compose -f docker-compose.prod.yml logs -f web    # solo frontend
docker compose -f docker-compose.prod.yml logs -f caddy  # HTTPS proxy

# Reiniciar un servicio
docker compose -f docker-compose.prod.yml restart api

# Parar todo
docker compose -f docker-compose.prod.yml down

# Reconstruir después de cambios
docker compose -f docker-compose.prod.yml up -d --build

# Ver certificados HTTPS (Caddy)
docker compose -f docker-compose.prod.yml exec caddy caddy list-certificates
```

---

## Cuando tengas dominio propio

1. Apuntar DNS A record de `canete.com` → `178.105.116.195`
2. Editar `infra/Caddyfile`:
   ```
   canete.com {
       # ... resto igual
   }
   ```
3. Push → deploy automático

---

## Troubleshooting

### No puedo acceder por HTTPS
- Hetzner no tiene firewall por defecto — todos los puertos están abiertos ✅
- Verificar que Caddy esté corriendo: `docker compose -f docker-compose.prod.yml ps caddy`
- Verificar iptables: `iptables -L INPUT -n`

### Certificado HTTPS tarda
- Caddy obtiene cert de Let's Encrypt al primer request — puede tardar 30-60s
- sslip.io debe resolver la IP correctamente: `nslookup 178.105.116.195.sslip.io`

### Cambiar de VPS
- Crear nuevo servidor en Hetzner Console
- Actualizar `VPS_HOST` en GitHub Secrets con la nueva IP
- El Caddyfile se actualiza automáticamente con la nueva IP en el deploy
