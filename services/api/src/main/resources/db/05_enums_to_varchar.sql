-- =============================================================================
-- Cañete Marketplace — Migración: enum types → VARCHAR
-- Archivo: 05_enums_to_varchar.sql
--
-- PostgreSQL custom enums no son compatibles con Hibernate/JDBC que enlaza
-- String como character varying. El operador = no resuelve entre tipos.
-- Solución definitiva: VARCHAR con datos preservados.
-- =============================================================================

SET search_path TO canete_marketplace, public;

-- 1. Eliminar casts que ya no serán necesarios
DROP CAST IF EXISTS (character varying AS canete_marketplace.tenant_status);
DROP CAST IF EXISTS (character varying AS canete_marketplace.tenant_category);
DROP CAST IF EXISTS (character varying AS canete_marketplace.plan_name);
DROP CAST IF EXISTS (character varying AS canete_marketplace.user_role);
DROP CAST IF EXISTS (character varying AS canete_marketplace.user_status);
DROP CAST IF EXISTS (character varying AS canete_marketplace.order_status);
DROP CAST IF EXISTS (character varying AS canete_marketplace.payment_method);
DROP CAST IF EXISTS (character varying AS canete_marketplace.reservation_status);
DROP CAST IF EXISTS (character varying AS canete_marketplace.coupon_type);
DROP CAST IF EXISTS (character varying AS canete_marketplace.campaign_type);
DROP CAST IF EXISTS (character varying AS canete_marketplace.campaign_status);

-- 2. Convertir columnas enum → VARCHAR (preserva datos con ::text)
ALTER TABLE canete_marketplace.tenants
    ALTER COLUMN status   TYPE VARCHAR(20) USING status::text,
    ALTER COLUMN category TYPE VARCHAR(30) USING category::text;

ALTER TABLE canete_marketplace.plans
    ALTER COLUMN name TYPE VARCHAR(20) USING name::text;

ALTER TABLE canete_marketplace.users
    ALTER COLUMN role   TYPE VARCHAR(30) USING role::text,
    ALTER COLUMN status TYPE VARCHAR(20) USING status::text;

ALTER TABLE canete_marketplace.orders
    ALTER COLUMN status         TYPE VARCHAR(20) USING status::text,
    ALTER COLUMN payment_method TYPE VARCHAR(30) USING payment_method::text;

ALTER TABLE canete_marketplace.reservations
    ALTER COLUMN status TYPE VARCHAR(20) USING status::text;

ALTER TABLE canete_marketplace.coupons
    ALTER COLUMN type TYPE VARCHAR(20) USING type::text;

ALTER TABLE canete_marketplace.campaigns
    ALTER COLUMN type   TYPE VARCHAR(20) USING type::text,
    ALTER COLUMN status TYPE VARCHAR(20) USING status::text;

-- 3. Eliminar tipos enum (ya no se usan)
DROP TYPE IF EXISTS canete_marketplace.tenant_status;
DROP TYPE IF EXISTS canete_marketplace.tenant_category;
DROP TYPE IF EXISTS canete_marketplace.plan_name;
DROP TYPE IF EXISTS canete_marketplace.user_role;
DROP TYPE IF EXISTS canete_marketplace.user_status;
DROP TYPE IF EXISTS canete_marketplace.order_status;
DROP TYPE IF EXISTS canete_marketplace.payment_method;
DROP TYPE IF EXISTS canete_marketplace.reservation_status;
DROP TYPE IF EXISTS canete_marketplace.coupon_type;
DROP TYPE IF EXISTS canete_marketplace.campaign_type;
DROP TYPE IF EXISTS canete_marketplace.campaign_status;

SELECT 'Migración completada: enum types → VARCHAR' AS resultado;
