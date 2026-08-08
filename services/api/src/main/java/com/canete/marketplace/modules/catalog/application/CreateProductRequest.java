package com.canete.marketplace.modules.catalog.application;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateProductRequest(
    @NotBlank String name,
    String description,
    @NotNull @DecimalMin("0") Double price,
    String category,
    String imageUrl,
    Boolean available,
    Integer stock,
    Integer sortOrder
) {}
