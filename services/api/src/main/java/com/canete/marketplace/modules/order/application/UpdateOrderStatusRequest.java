package com.canete.marketplace.modules.order.application;

import jakarta.validation.constraints.NotBlank;

public record UpdateOrderStatusRequest(
    @NotBlank String status
) {
}
