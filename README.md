# Canete Marketplace Platform

Marketplace turistico y gastronomico multiempresa inspirado en Airbnb, Uber Eats, Booking y Shopify.

## Arquitectura

- `Frontend/`: frontend Next.js 15 + Tailwind + Framer Motion + Zustand + TanStack Query.
- **Backend**: repo separado [`yhassuoG/canete-api`](https://github.com/yhassuoG/canete-api) — Spring Boot 3, Java 21. Se publica como imagen Docker en `ghcr.io/yhassuog/canete-api:latest`.
- `infra/db`: scripts SQL de inicialización (montados por el contenedor postgres).
- `infra/Caddyfile`: reverse proxy HTTPS (Caddy 2 + Let's Encrypt).
- `docker-compose.prod.yml`: stack de producción — web (build local) + api (imagen GHCR) + postgres + redis + caddy.

## Modulos base incluidos

- Landing page premium con narrativa visual y buscador.
- Marketplace turistico con categorias y negocios destacados.
- Base multiempresa con `tenantSlug` en los modelos expuestos.
- API inicial para catalogo, reservas y pedidos.
- Seguridad Spring Security + JWT listos para extender.
- Pipeline CI para build de frontend.

## Arranque local

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

### Backend

El backend ahora vive en [`yhassuoG/canete-api`](https://github.com/yhassuoG/canete-api). Clonar y ejecutar:

```bash
git clone https://github.com/yhassuoG/canete-api.git
cd canete-api
mvn spring-boot:run
```

### Docker Compose (producción)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## Siguientes extensiones recomendadas

1. Persistencia real de catalogo, reservas, pedidos y usuarios con PostgreSQL.
2. Emision y refresco de JWT con login social OAuth2.
3. Pasarela de pagos y tracking en tiempo real.
4. Subdominios por negocio y onboarding multi-tenant.
