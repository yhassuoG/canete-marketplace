package com.canete.marketplace.modules.order.application;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
    UUID id,
    UUID tenantId,
    UUID customerId,
    String customerName,
    String customerPhone,
    String customerAddress,
    String status,
    String deliveryType,
    String paymentMethod,
    String paymentReference,
    BigDecimal subtotal,
    BigDecimal deliveryFee,
    BigDecimal discount,
    BigDecimal total,
    String notes,
    // ── Mercado Pago ──
    String mpPreferenceId,
    String mpInitPoint,         // URL de checkout (para redirigir al cliente)
    Long mpPaymentId,
    String mpPaymentStatus,     // pending | approved | rejected | ...
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    OffsetDateTime deliveredAt,
    List<OrderItemResponse> items
) {
    public record OrderItemResponse(
        UUID id,
        UUID productId,
        String productName,
        BigDecimal unitPrice,
        int quantity,
        BigDecimal subtotal
    ) {}
}
