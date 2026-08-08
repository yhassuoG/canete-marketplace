package com.canete.marketplace.modules.catalog.domain;

import java.math.BigDecimal;

public record Product(
    String id,
    String tenantId,
    String name,
    String description,
    BigDecimal price,
    String category,
    String imageUrl,
    boolean available,
    Integer stock,
    int sortOrder
) {}
