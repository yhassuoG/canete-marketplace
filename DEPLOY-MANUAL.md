# 🚀 Despliegue Manual — Valle Canete (vallecanete.com)

Guía completa paso a paso para desplegar el marketplace desde cero en un VPS Hetzner con dominio propio y HTTPS automático (Let's Encrypt gratis).

> **Estado actual (agosto 2026):** Producción live en `https://vallecanete.com`
>
> | Componente | Valor |
> |------------|-------|
> | VPS | Hetzner CX23, Falkenstein, 2 vCPU, 4GB RAM, 40GB NVMe — €4.59/mes |
> | IP pública | `178.105.116.195` |
> | Dominio | `vallecanete.com` (Cloudflare DNS) |
> | HTTPS | Let's Encrypt automático via Caddy (renueva solo) |
> | CD | GitHub Actions en push a `main` |

---

## Arquitectura

```
Internet → Caddy (80/443, HTTPS auto Let's Encrypt)
              ├─ /api/*  → api:8080    (Spring Boot 3.4, Java 21)
              └─ /*      → web:3000    (Next.js 15, React 19)
                              ↓
                    postgres:5432 (PostgreSQL 16)
                    redis:6379   (Redis 7)
```

| Servicio | Tecnología | Puerto | Contenedor |
|----------|-----------|--------|------------|
| Proxy + HTTPS | Caddy 2 | 80, 443 | `canete-caddy-1` |
| Frontend | Next.js 15 + React 19 | 3000 (interno) | `canete-web-1` |
| Backend | Spring Boot 3.4 + Java 21 | 8080 (interno) | `canete-api-1` |
| Base de datos | PostgreSQL 16 | 5432 (interno) | `canete-postgres-1` |
| Cache | Redis 7 | 6379 (interno) | `canete-redis-1` |

---

## PARTE 1 — Crear el VPS en Hetzner Cloud

1. Ir a **https://console.hetzner.cloud** → registrarse con tarjeta de crédito.
2. Crear proyecto: `canete-prod`.
3. Crear servidor:
   - **Location**: Falkenstein (`fsn1`)
   - **Image**: Ubuntu 22.04
   - **Type**: CX23 (x86 AMD, 2 vCPU, 4GB RAM) — €4.59/mes
   - **Authentication**: Root password (Hetzner lo envía por email)
4. Anotar la **IP pública** (en este caso `178.105.116.195`).

> Hetzner **no tiene firewall por defecto** — todos los puertos (80, 443, 22) están abiertos. No requiere configuración adicional de firewall.

---

## PARTE 2 — Configurar el VPS (primera vez)

Conectar como root (usar el password del email de Hetzner):

```bash
ssh root@178.105.116.195
```

### 2.1 Instalar Docker

```bash
curl -fsSL https://get.docker.com | sh
docker --version   # verificar: Docker version 29.x
```

### 2.2 Crear usuario `deploy`

```bash
adduser deploy
usermod -aG docker deploy
```

### 2.3 Generar clave SSH para el usuario deploy

```bash
su - deploy
ssh-keygen -t ed25519 -C "canete-deploy" -f ~/.ssh/canete_deploy_key -N ""
cat ~/.ssh/canete_deploy_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit
```

### 2.4 Guardar la clave privada localmente

Desde tu máquina local, copiar la clave privada del VPS:

```bash
scp root@178.105.116.195:/home/deploy/.ssh/canete_deploy_key d:\proyecto\infra\vps-ssh-key.txt
```

> ⚠️ **NUNCA commitear `infra/vps-ssh-key.txt` al repo.** Verificar que esté en `.gitignore`.

### 2.5 Probar conexión SSH como deploy

```bash
ssh -i d:\proyecto\infra\vps-ssh-key.txt deploy@178.105.116.195
# Debe entrar sin password
```

---

## PARTE 3 — Registrar dominio en Cloudflare

1. Comprar/transferir dominio `vallecanete.com` a **Cloudflare** (https://dash.cloudflare.com).
2. Cloudflare asigna los nameservers (`jillian.ns.cloudflare.com`, etc.).
3. En el dashboard de Cloudflare → **DNS → Records → Add record**:
   - **Type**: `A`
   - **Name**: `@` (dominio raíz)
   - **IPv4 address**: `178.105.116.195`
   - **Proxy status**: 🩶 **DNS only** (nube gris — **NO** naranja)
   - **TTL**: Auto

> ⚠️ **CRÍTICO:** El proxy de Cloudflare (nube naranja) **no funciona** con Caddy porque Caddy necesita validación TLS-ALPN-01 directa en el puerto 443. Cloudflare proxy intercepta ese tráfico. Usar **DNS only** (nube gris). Caddy obtiene el certificado Let's Encrypt directamente.

4. Verificar DNS:

```bash
nslookup vallecanete.com 1.1.1.1
# Debe responder: 178.105.116.195
```

---

## PARTE 4 — Configurar archivos del proyecto

### 4.1 Caddyfile (`infra/Caddyfile`)

Caddy es el reverse proxy que termina HTTPS y obtiene certificados Let's Encrypt automáticamente.

```
{
    # email tu-email@gmail.com  # opcional: notificaciones de renovación
}

vallecanete.com {
    encode gzip zstd

    # API backend — /api/* va al Spring Boot
    handle /api/* {
        reverse_proxy api:8080 {
            header_up Host {host}
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # Resto al frontend Next.js
    handle {
        reverse_proxy web:3000 {
            header_up Host {host}
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
        }
    }
}

# HTTP -> HTTPS redirect
:80 {
    redir https://{host}{uri} 308
}
```

> **Para cambiar de dominio:** reemplazar `vallecanete.com` por el nuevo dominio en la línea del site block. Caddy hace el resto (obtiene cert nuevo automáticamente).

### 4.2 docker-compose.prod.yml

Archivo `docker-compose.prod.yml` en la raíz del repo. Define los 5 servicios: `web`, `api`, `postgres`, `redis`, `caddy`.

Puntos clave:
- **web**: construye desde `./Frontend` (Next.js). Variable `NEXT_PUBLIC_API_URL` = URL pública.
- **api**: usa imagen pre-construida de GHCR (`ghcr.io/yhassuog/canete-api:latest`).
- **postgres**: monta `./infra/db` como init scripts (se ejecutan al primer arranque).
- **caddy**: puertos 80/443, monta `./infra/Caddyfile` y volúmenes para datos de cert.

### 4.3 GitHub Actions CD (`.github/workflows/deploy-vps.yml`)

Workflow que se dispara en cada push a `main`:

1. Hace checkout del repo.
2. Configura SSH con `VPS_SSH_KEY`.
3. `rsync` sincroniza archivos al VPS (excluye node_modules, target, .next, .git).
4. Escribe `.env` en el VPS con los secrets.
5. Login a GHCR en el VPS con `GHCR_PAT`.
6. `docker compose -f docker-compose.prod.yml pull api` (pull backend image).
7. `docker compose -f docker-compose.prod.yml up -d --build` (deploy).
8. Health check: curl a `https://vallecanete.com`.

---

## PARTE 5 — Configurar GitHub Secrets

En el repo: **Settings → Secrets and variables → Actions → New secret**

| Secret | Valor | Descripción |
|--------|-------|-------------|
| `VPS_HOST` | `178.105.116.195` | IP pública del VPS |
| `VPS_USER` | `deploy` | Usuario SSH |
| `VPS_SSH_KEY` | *(contenido de `infra/vps-ssh-key.txt`)* | Clave privada SSH completa |
| `DEPLOY_PATH` | `/home/deploy/canete` | Ruta del proyecto en el VPS |
| `JWT_SECRET` | `c4n3t3-m4rk3tpl4c3-pr0d-...` | Secreto JWT de producción |
| `DB_PASSWORD` | *(password seguro)* | Password de PostgreSQL |
| `MP_ACCESS_TOKEN` | *(token MP)* | Token de Mercado Pago producción |
| `MP_PUBLIC_KEY` | *(public key MP)* | Public key de Mercado Pago |
| `MP_SANDBOX` | `false` | `false` = producción, `true` = homologación |
| `GHCR_PAT` | *(PAT con `read:packages`)* | Personal Access Token para GHCR |

> **Para crear el GHCR_PAT:** GitHub → Settings → Developer settings → Personal access tokens → Fine-grained → nuevo con permiso `read:packages` sobre el repo `yhassuoG/canete-api`.

---

## PARTE 6 — Primer despliegue

### Opción A: Automático (GitHub Actions)

```bash
git add .
git commit -m "feat: production deploy with vallecanete.com domain"
git push origin main
```

Monitorear en la pestaña **Actions** del repo. Tarda ~5-10 min.

### Opción B: Manual (SSH directo)

```bash
# Desde tu máquina
ssh -i d:\proyecto\infra\vps-ssh-key.txt deploy@178.105.116.195

# En el VPS
cd /home/deploy/canete

# Login a GHCR (para pull del backend)
echo "TU_GHCR_PAT" | docker login ghcr.io -u yhassuoG --password-stdin

# Deploy
docker compose -f docker-compose.prod.yml up -d --build

# Ver estado
docker compose -f docker-compose.prod.yml ps
```

---

## PARTE 7 — Verificar el despliegue

### 7.1 Health checks

```bash
# Frontend (debe dar 200)
curl -s -o /dev/null -w "%{http_code}" https://vallecanete.com
# → 200

# API health
curl -s https://vallecanete.com/api/v1/actuator/health
# → {"status":"UP"}

# Tenant storefront
curl -s -o /dev/null -w "%{http_code}" https://vallecanete.com/alfajores
# → 200
```

### 7.2 Verificar certificado HTTPS

```bash
echo | openssl s_client -connect vallecanete.com:443 -servername vallecanete.com 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
# subject=CN = vallecanete.com
# issuer=C = US, O = Let's Encrypt, CN = YE1
# notBefore=...  notAfter=...  (válido 3 meses, renueva solo)
```

### 7.3 Ver contenedores

```bash
ssh -i d:\proyecto\infra\vps-ssh-key.txt deploy@178.105.116.195 \
  "docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'"
```

Salida esperada:

```
NAMES               IMAGE                                STATUS
canete-web-1        canete-web                           Up
canete-caddy-1      caddy:2-alpine                       Up
canete-api-1        ghcr.io/yhassuog/canete-api:latest   Up
canete-postgres-1   postgres:16                          Up (healthy)
canete-redis-1      redis:7-alpine                       Up
```

### 7.4 Logs de Caddy (cert HTTPS)

```bash
ssh -i d:\proyecto\infra\vps-ssh-key.txt deploy@178.105.116.195 \
  "docker logs canete-caddy-1 --tail 20"
```

Debe mostrar: `"certificate obtained successfully","identifier":"vallecanete.com"`

---

## PARTE 8 — Cambiar de dominio (sslip.io → dominio propio)

Si el VPS ya estaba corriendo con `<ip>.sslip.io` y quieres pasar a un dominio propio:

### 8.1 Crear DNS record en Cloudflare

- Type A, Name `@`, IPv4 `178.105.116.195`, Proxy **DNS only** (gris).

### 8.2 Editar Caddyfile en el VPS

```bash
ssh -i d:\proyecto\infra\vps-ssh-key.txt deploy@178.105.116.195
sed -i 's/178.105.116.195.sslip.io/vallecanete.com/g' /home/deploy/canete/infra/Caddyfile
cat /home/deploy/canete/infra/Caddyfile  # verificar
```

### 8.3 Reiniciar Caddy

> ⚠️ **Importante:** El contenedor Caddy puede ser un contenedor huérfano (no gestionado por docker-compose con el nombre `caddy`). Usar `docker restart` directo:

```bash
docker restart canete-caddy-1
```

### 8.4 Esperar y verificar

```bash
sleep 10
docker logs canete-caddy-1 --tail 15
# Debe mostrar "certificate obtained successfully" para vallecanete.com

curl -s -o /dev/null -w "%{http_code}" https://vallecanete.com
# → 200
```

### 8.5 Actualizar Caddyfile en el repo local

Editar `d:\proyecto\infra\Caddyfile` y cambiar el dominio para que el próximo deploy del workflow no lo revierta.

---

## PARTE 9 — Comandos útiles en el VPS

Conectar:

```bash
ssh -i d:\proyecto\infra\vps-ssh-key.txt deploy@178.105.116.195
cd /home/deploy/canete
```

Operaciones:

```bash
# Estado de contenedores
docker compose -f docker-compose.prod.yml ps

# Logs en vivo
docker compose -f docker-compose.prod.yml logs -f api     # backend
docker compose -f docker-compose.prod.yml logs -f web     # frontend
docker compose -f docker-compose.prod.yml logs -f caddy   # HTTPS proxy

# Reiniciar un servicio
docker compose -f docker-compose.prod.yml restart api

# Parar todo
docker compose -f docker-compose.prod.yml down

# Reconstruir después de cambios
docker compose -f docker-compose.prod.yml up -d --build

# Ver certificados HTTPS
docker exec canete-caddy-1 caddy list-certificates

# Acceder a PostgreSQL
docker exec -it canete-postgres-1 psql -U postgres -d canete_marketplace

# Limpiar imágenes viejas
docker image prune -f
```

---

## PARTE 10 — Troubleshooting

### No puedo acceder por HTTPS

1. Verificar que Caddy esté corriendo: `docker ps | grep caddy`
2. Verificar DNS: `nslookup vallecanete.com 1.1.1.1` → debe dar `178.105.116.195`
3. Verificar que Cloudflare proxy esté **off** (nube gris, DNS only)
4. Verificar iptables: `iptables -L INPUT -n` (Hetzner no bloquea nada por defecto)
5. Ver logs de Caddy: `docker logs canete-caddy-1 --tail 30`

### El certificado HTTPS tarda

- Caddy obtiene el cert al primer request — puede tardar 30-60s.
- Si falla la validación TLS-ALPN-01, verificar que el puerto 443 esté abierto y el DNS apunte directo al VPS (no a Cloudflare proxy).

### DNS resuelve distinto desde mi máquina

- El ISP puede tener cache negativo (NXDOMAIN cacheado). Soluciones:
  1. `ipconfig /flushdns` (Windows) — limpia cache local.
  2. Cambiar DNS de Windows a Cloudflare/Google (necesita admin):
     ```powershell
     Set-DnsClientServerAddress -InterfaceAlias "Wi-Fi 2" -ServerAddresses ("1.1.1.1","8.8.8.8")
     ipconfig /flushdns
     ```
  3. Esperar a que expire el cache del ISP (5-30 min).
  4. Probar con resolver forzado: `curl --resolve "vallecanete.com:443:178.105.116.195" https://vallecanete.com`

### `caddy reload` dice "config is unchanged"

- El Caddyfile del host se editó pero Caddy no lo detectó. Hacer `docker restart canete-caddy-1` (restart completo, no reload).

### `docker compose restart caddy` dice "no such service: caddy"

- El contenedor Caddy es un contenedor huérfano (creado fuera de docker-compose). Usar `docker restart canete-caddy-1` directo.

### Cambiar de VPS

1. Crear nuevo servidor en Hetzner Console.
2. Repetir PARTE 2 (configurar VPS: Docker, usuario deploy, SSH key).
3. Actualizar `VPS_HOST` en GitHub Secrets con la nueva IP.
4. Actualizar DNS A record en Cloudflare con la nueva IP.
5. Editar Caddyfile si usa IP hardcodeada.
6. Push a `main` para disparar deploy.

---

## Resumen de costos

| Item | Costo |
|------|-------|
| Hetzner CX23 VPS | €4.59/mes |
| Dominio Cloudflare | ~$10/año |
| Let's Encrypt HTTPS | Gratis |
| GitHub Actions | Gratis (público) |
| GHCR (Container Registry) | Gratis |
| **Total** | **~€5.4/mes** |

---

*Documentado el 9 ago 2026. Producción live en https://vallecanete.com*
