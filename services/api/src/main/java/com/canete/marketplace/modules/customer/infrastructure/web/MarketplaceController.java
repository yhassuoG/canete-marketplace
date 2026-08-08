package com.canete.marketplace.modules.customer.infrastructure.web;

import com.canete.marketplace.modules.customer.application.MarketplaceService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * Marketplace-level authentication and subscription endpoints.
 *
 *  POST /api/v1/marketplace/auth/google-access  — sign in / create global account
 *  GET  /api/v1/marketplace/account/{id}        — get account + subscriptions
 *  POST /api/v1/marketplace/subscribe           — subscribe to a tenant
 *  GET  /api/v1/marketplace/subscribed          — check subscription status
 */
@Validated
@RestController
@RequestMapping("/api/v1/marketplace")
@CrossOrigin(origins = "*")
public class MarketplaceController {

    private final MarketplaceService marketplaceService;

    public MarketplaceController(MarketplaceService marketplaceService) {
        this.marketplaceService = marketplaceService;
    }

    // ─── Request bodies ───────────────────────────────────────────────────────

    public record GoogleAccessRequest(
        @NotBlank String sub,
        @NotBlank String email,
        @NotBlank String name,
        String picture
    ) {}

    public record SubscribeRequest(
        @NotBlank String accountId,
        @NotBlank String tenantSlug
    ) {}

    // ─── Endpoints ────────────────────────────────────────────────────────────

    /**
     * Called after the user signs in with Google on the main marketplace page.
     * Creates or updates the global marketplace account.
     */
    @PostMapping("/auth/google-access")
    public ResponseEntity<MarketplaceService.AccountDto> googleAccess(
            @RequestBody @Validated GoogleAccessRequest req) {

        var account = marketplaceService.upsertAccount(
                req.sub(), req.email(), req.name(), req.picture());
        return ResponseEntity.ok(account);
    }

    /**
     * Returns the account info and current tenant subscriptions.
     * Called on page load to restore session.
     */
    @GetMapping("/account/{id}")
    public ResponseEntity<MarketplaceService.AccountDto> getAccount(
            @PathVariable String id) {

        return marketplaceService.getAccount(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Subscribes the signed-in account to a tenant store.
     * Idempotent — calling it again for an already-subscribed tenant is safe.
     */
    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(
            @RequestBody @Validated SubscribeRequest req) {

        return marketplaceService.subscribe(req.accountId(), req.tenantSlug())
                .map(result -> ResponseEntity.ok(
                        new SubscribeResponse(result.customer(),
                                result.isNew() ? "subscribed" : "already_subscribed")))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Quick check: is this account already subscribed to this tenant?
     */
    @GetMapping("/subscribed")
    public ResponseEntity<SubscribedResponse> isSubscribed(
            @RequestParam String accountId,
            @RequestParam String tenantSlug) {

        boolean sub = marketplaceService.isSubscribed(accountId, tenantSlug);
        return ResponseEntity.ok(new SubscribedResponse(sub));
    }

    // ─── Response records ─────────────────────────────────────────────────────
    public record SubscribeResponse(Object customer, String status) {}
    public record SubscribedResponse(boolean subscribed) {}
}
