package com.canete.marketplace.modules.tenant.application;

public record UpdateTenantConfigRequest(
    String name,
    String tagline,
    String description,
    String phone,
    String address,
    String lat,
    String lng,
    String primaryColor,
    Boolean allowsDelivery,
    Boolean allowsPickup,
    String deliveryFee,
    String yapePhone,
    String yapeQrUrl,
    String bannerUrl,
    String logoUrl
) {}
