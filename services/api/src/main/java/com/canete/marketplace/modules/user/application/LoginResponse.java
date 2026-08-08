package com.canete.marketplace.modules.user.application;

public record LoginResponse(
    String email,
    String name,
    String role,         // "admin" | "business"
    String tenantSlug    // null for admin
) {}
