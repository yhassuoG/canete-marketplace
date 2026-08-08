# Base de datos — Cañete Marketplace

Motor: **PostgreSQL 14+**
Base de datos: `canete_marketplace`

## Setup rápido

```bash
# 1. Crear la BD
psql -U postgres -c "CREATE DATABASE canete_marketplace;"

# 2. Ejecutar scripts en orden
psql -U postgres -d canete_marketplace -f 01_schema.sql
psql -U postgres -d canete_marketplace -f 02_procedures.sql
psql -U postgres -d canete_marketplace -f 03_seed.sql
```

## Credenciales por defecto (`application.yml`)

| Variable | Valor por defecto |
|---|---|
| Host | `localhost:5432` |
| DB | `canete_marketplace` |
| Usuario | `postgres` |
| Contraseña | `postgres` |

Override con variables de entorno: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`

---

## Tablas

| Tabla | Descripción |
|---|---|
| `plans` | Planes de suscripción (starter, premium, enterprise) |
| `tenants` | Negocios registrados en la plataforma |
| `tenant_config` | Ubicación GPS, horarios, redes sociales por tenant |
| `users` | Usuarios del sistema (admin, business_owner) |
| `products` | Catálogo de productos/servicios de cada tenant |
| `customers` | Clientes finales por tenant |
| `orders` | Pedidos de delivery |
| `order_items` | Líneas de cada pedido |
| `reservations` | Reservas (mesas, tours, habitaciones) |
| `reviews` | Reseñas y calificaciones |
| `campaigns` | Campañas de email/SMS/push |
| `coupons` | Cupones de descuento |
| `analytics_daily` | Métricas pre-agregadas por día |

## Vistas

| Vista | Descripción |
|---|---|
| `v_catalog_listings` | Listings del marketplace (usada por `CatalogController`) |
| `v_tenant_metrics` | Métricas por tenant (usada por dashboard) |
| `v_global_metrics` | Métricas globales de plataforma |

## Stored Procedures

| Función | Descripción |
|---|---|
| `sp_create_order(...)` | Crea orden + items en una transacción, aplica cupón automáticamente |
| `sp_validate_coupon(tenant_id, code, total)` | Valida un cupón y devuelve el descuento |
| `sp_get_tenant_dashboard(slug)` | Dashboard completo de un tenant |
| `sp_get_revenue_series(tenant_id, weeks)` | Serie temporal de ingresos para gráficos |
| `sp_register_customer(...)` | Upsert de cliente por tenant + email/teléfono |
| `sp_aggregate_daily_analytics(date)` | Agrega métricas del día (llamar con pg_cron) |

## Triggers automáticos

| Trigger | Evento | Efecto |
|---|---|---|
| `trg_reviews_recalculate_rating` | INSERT/UPDATE/DELETE en `reviews` | Recalcula `rating` y `review_count` en `tenants` |
| `trg_orders_update_tenant_stats` | UPDATE status en `orders` | Actualiza `monthly_revenue`, `orders_this_month` y stats del cliente |
| `trg_reservations_update_stats` | UPDATE status en `reservations` | Actualiza `reservations_this_month` en `tenants` |
| `trg_*_updated_at` | BEFORE UPDATE en todas las tablas | Setea `updated_at = now()` automáticamente |

## Usuarios de prueba (seed)

| Email | Contraseña | Rol | Tenant |
|---|---|---|---|
| `admin@canete.app` | `admin123` | admin | — |
| `muelle@demo.com` | `demo123` | business_owner | muelle-pacifico |
| `paraiso@demo.com` | `demo123` | business_owner | paraiso-lunahuana |
| `vina@demo.com` | `demo123` | business_owner | vina-del-sol |
| `hotel@demo.com` | `demo123` | business_owner | hotel-luna |

> Los hashes en `03_seed.sql` son BCrypt de `admin123` para el admin y `demo123` para las cuentas demo. Para producción regenerar con `BCryptPasswordEncoder`.
