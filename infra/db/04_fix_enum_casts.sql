-- =============================================================================
-- Cañete Marketplace — Fix: Casts implícitos para tipos enum PostgreSQL
-- Archivo: 04_fix_enum_casts.sql
-- Ejecutar una vez si Hibernate lanza:
--   "el operador no existe: <enum_type> = character varying"
--
-- PostgreSQL no hace cast automático de varchar → enum personalizado.
-- Estos casts IMPLICIT resuelven la incompatibilidad con Hibernate/JDBC
-- que siempre enlaza String como character varying.
-- =============================================================================

SET search_path TO canete_marketplace, public;

CREATE CAST (character varying AS canete_marketplace.tenant_status)
    WITH INOUT AS IMPLICIT;

CREATE CAST (character varying AS canete_marketplace.tenant_category)
    WITH INOUT AS IMPLICIT;

CREATE CAST (character varying AS canete_marketplace.plan_name)
    WITH INOUT AS IMPLICIT;

CREATE CAST (character varying AS canete_marketplace.user_role)
    WITH INOUT AS IMPLICIT;

CREATE CAST (character varying AS canete_marketplace.user_status)
    WITH INOUT AS IMPLICIT;

CREATE CAST (character varying AS canete_marketplace.order_status)
    WITH INOUT AS IMPLICIT;

CREATE CAST (character varying AS canete_marketplace.payment_method)
    WITH INOUT AS IMPLICIT;

CREATE CAST (character varying AS canete_marketplace.reservation_status)
    WITH INOUT AS IMPLICIT;

CREATE CAST (character varying AS canete_marketplace.coupon_type)
    WITH INOUT AS IMPLICIT;

CREATE CAST (character varying AS canete_marketplace.campaign_type)
    WITH INOUT AS IMPLICIT;

CREATE CAST (character varying AS canete_marketplace.campaign_status)
    WITH INOUT AS IMPLICIT;
