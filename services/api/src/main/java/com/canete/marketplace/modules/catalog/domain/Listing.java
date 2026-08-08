package com.canete.marketplace.modules.catalog.domain;

public record Listing(
    String id,
    String tenantSlug,
    String businessName,
    String category,
    String district,
    double rating,
    boolean reservable,
    boolean deliveryEnabled
) {
}
