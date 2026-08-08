package com.canete.marketplace.shared.web;

public record ApiErrorResponse(
    String code,
    String message
) {
}
