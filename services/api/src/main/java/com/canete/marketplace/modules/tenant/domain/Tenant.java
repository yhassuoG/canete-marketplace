package com.canete.marketplace.modules.tenant.domain;

public record Tenant(
    String id,
    String slug,
    String name,
    String tagline,
    String category,
    String location,
    String plan,
    String status,
    double rating,
    int reviewCount,
    double monthlyRevenue,
    int reservationsThisMonth,
    int ordersThisMonth,
    String primaryColor,
    String gradient,
    String description,
    String phone,
    java.util.List<String> features,
    // Dynamic config (lat/lng/address come from tenant_config table)
    Double lat,
    Double lng,
    String address,
    // Delivery / pickup configuration
    Boolean allowsDelivery,
    Boolean allowsPickup,
    java.math.BigDecimal deliveryFee,
    String yapePhone,
    String yapeQrUrl,
    String bannerUrl,
    String logoUrl
) {}
