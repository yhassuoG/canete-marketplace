package com.canete.marketplace.modules.reservation.application;

import java.math.BigDecimal;

public record ReservationQuote(
    String tenantSlug,
    String serviceType,
    int guests,
    BigDecimal subtotal,
    BigDecimal serviceFee,
    BigDecimal total
) {
}
