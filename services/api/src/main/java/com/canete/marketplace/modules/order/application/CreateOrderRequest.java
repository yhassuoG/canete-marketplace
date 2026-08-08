package com.canete.marketplace.modules.order.application;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateOrderRequest(
    @NotNull UUID tenantId,
    UUID customerId,
    @NotBlank String customerName,
    String customerPhone,
    String customerAddress,
    @NotNull String deliveryType,   // "pickup" | "delivery"
    String paymentMethod,
    String paymentReference,        // ej. código de operación Yape/Plin
    String notes,
    @NotEmpty List<OrderItemDto> items
) {
    public record OrderItemDto(
        String productId,
        @NotBlank String name,
        @NotNull BigDecimal price,
        int qty
    ) {}
}
