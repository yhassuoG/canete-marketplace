# Canete Marketplace Platform

Marketplace turistico y gastronomico multiempresa inspirado en Airbnb, Uber Eats, Booking y Shopify.

## Arquitectura

- `apps/web`: frontend Next.js 15 + Tailwind + Framer Motion + Zustand + TanStack Query.
- `services/api`: backend Spring Boot 3 con estructura modular inspirada en hexagonal.
- `infra/nginx`: proxy reverso para frontend y API.
- `docker-compose.yml`: stack local con web, api, postgres, redis y nginx.

## Modulos base incluidos

- Landing page premium con narrativa visual y buscador.
- Marketplace turistico con categorias y negocios destacados.
- Base multiempresa con `tenantSlug` en los modelos expuestos.
- API inicial para catalogo, reservas y pedidos.
- Seguridad Spring Security + JWT listos para extender.
- Pipeline CI para build de frontend y backend.

## Arranque local

### Frontend

```bash
cd apps/web
npm install
npm run dev
```

### Backend

```bash
cd services/api
mvn spring-boot:run
```

### Docker Compose

```bash
docker compose up --build
```

## Siguientes extensiones recomendadas

1. Persistencia real de catalogo, reservas, pedidos y usuarios con PostgreSQL.
2. Emision y refresco de JWT con login social OAuth2.
3. Pasarela de pagos y tracking en tiempo real.
4. Subdominios por negocio y onboarding multi-tenant.
