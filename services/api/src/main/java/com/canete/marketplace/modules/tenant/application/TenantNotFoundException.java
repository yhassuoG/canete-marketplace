package com.canete.marketplace.modules.tenant.application;

public class TenantNotFoundException extends RuntimeException {
    public TenantNotFoundException(String slug) {
        super("Tenant not found: " + slug);
    }
}
