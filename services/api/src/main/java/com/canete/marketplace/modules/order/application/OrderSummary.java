package com.canete.marketplace.modules.order.application;

import java.math.BigDecimal;
import java.util.List;

public record OrderSummary(
    String tenantSlug,
    List<String> items,
    BigDecimal subtotal,
    BigDecimal deliveryFee,
    BigDecimal total,
    String status
) {
}
