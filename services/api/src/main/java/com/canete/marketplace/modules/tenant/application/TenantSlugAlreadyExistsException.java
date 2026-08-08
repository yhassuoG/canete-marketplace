package com.canete.marketplace.modules.tenant.application;

public class TenantSlugAlreadyExistsException extends RuntimeException {
    public TenantSlugAlreadyExistsException(String slug) {
        super("Tenant slug already exists: " + slug);
    }
}
