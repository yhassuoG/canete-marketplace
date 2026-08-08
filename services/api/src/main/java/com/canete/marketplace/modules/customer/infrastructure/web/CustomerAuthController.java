package com.canete.marketplace.modules.customer.infrastructure.web;

import com.canete.marketplace.modules.customer.application.CustomerDto;
import com.canete.marketplace.modules.customer.application.CustomerService;
import com.canete.marketplace.modules.customer.application.GoogleTokenVerifier;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Public endpoint for customer authentication via Google.
 * Called from the tenant storefront when a visitor signs in with Google.
 */
@Validated
@RestController
@RequestMapping("/api/v1/customer-auth")
@CrossOrigin(origins = "*")
public class CustomerAuthController {

    private final GoogleTokenVerifier tokenVerifier;
    private final CustomerService customerService;

    public CustomerAuthController(GoogleTokenVerifier tokenVerifier, CustomerService customerService) {
        this.tokenVerifier   = tokenVerifier;
        this.customerService = customerService;
    }

    public record GoogleLoginRequest(
        @NotBlank String idToken,
        @NotBlank String tenantSlug
    ) {}

    public record GoogleAccessRequest(
        @NotBlank String sub,
        @NotBlank String email,
        @NotBlank String name,
        String picture,
        @NotBlank String tenantSlug
    ) {}

    /**
     * POST /api/v1/customer-auth/google
     * Verifies a Google ID token, creates/updates customer, returns CustomerDto.
     */
    @PostMapping("/google")
    public ResponseEntity<CustomerDto> googleLogin(
            @RequestBody @Validated GoogleLoginRequest req) {

        var claims = tokenVerifier.verify(req.idToken());
        if (claims.isEmpty()) return ResponseEntity.status(401).build();

        UUID tenantId = customerService.resolveTenantId(req.tenantSlug()).orElse(null);
        if (tenantId == null) return ResponseEntity.status(404).build();

        var c = claims.get();
        return ResponseEntity.ok(
                customerService.upsert(tenantId, c.email(), c.name(), c.sub(), c.picture()));
    }

    /**
     * POST /api/v1/customer-auth/google-access
     * Receives verified Google userinfo (sub, email, name, picture) from the frontend.
     * Simpler flow: frontend calls Google userinfo API with access_token, then sends
     * the result here. No ID-token verification needed.
     */
    @PostMapping("/google-access")
    public ResponseEntity<CustomerDto> googleAccess(
            @RequestBody @Validated GoogleAccessRequest req) {

        if (req.sub() == null || req.sub().isBlank()) return ResponseEntity.status(400).build();

        UUID tenantId = customerService.resolveTenantId(req.tenantSlug()).orElse(null);
        if (tenantId == null) return ResponseEntity.status(404).build();

        return ResponseEntity.ok(
                customerService.upsert(tenantId, req.email(), req.name(), req.sub(), req.picture()));
    }
}
