package com.canete.marketplace.modules.customer.application;

import com.canete.marketplace.modules.customer.infrastructure.persistence.CustomerEntity;
import com.canete.marketplace.modules.customer.infrastructure.persistence.CustomerRepository;
import com.canete.marketplace.modules.customer.infrastructure.persistence.MarketplaceAccountEntity;
import com.canete.marketplace.modules.customer.infrastructure.persistence.MarketplaceAccountRepository;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.TenantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class MarketplaceService {

    private final MarketplaceAccountRepository accountRepo;
    private final CustomerRepository customerRepo;
    private final TenantRepository tenantRepo;

    public MarketplaceService(MarketplaceAccountRepository accountRepo,
                              CustomerRepository customerRepo,
                              TenantRepository tenantRepo) {
        this.accountRepo  = accountRepo;
        this.customerRepo = customerRepo;
        this.tenantRepo   = tenantRepo;
    }

    // ─── DTOs ─────────────────────────────────────────────────────────────────

    public record AccountDto(
        String id, String email, String name, String avatarUrl,
        List<String> subscribedTenants
    ) {}

    public record SubscribeResult(CustomerDto customer, boolean isNew) {}

    // ─── Global account (Google login) ────────────────────────────────────────

    /**
     * Creates or updates the global marketplace account for a Google user.
     * Called from the main marketplace header sign-in.
     */
    @Transactional
    public AccountDto upsertAccount(String googleSub, String email,
                                    String fullName, String avatarUrl) {
        MarketplaceAccountEntity acc = accountRepo.findByGoogleSub(googleSub)
                .orElseGet(() -> accountRepo.findByEmail(email)
                        .orElseGet(MarketplaceAccountEntity::new));

        acc.setGoogleSub(googleSub);
        acc.setEmail(email);
        acc.setFullName(fullName);
        if (avatarUrl != null) acc.setAvatarUrl(avatarUrl);

        acc = accountRepo.save(acc);

        List<String> subs = customerRepo.findByAccountId(acc.getId())
                .stream()
                .map(c -> tenantRepo.findById(c.getTenantId())
                        .map(t -> t.getSlug()).orElse(null))
                .filter(s -> s != null)
                .toList();

        return new AccountDto(acc.getId().toString(), acc.getEmail(),
                acc.getFullName(), acc.getAvatarUrl(), subs);
    }

    /** Refresh account info + current subscriptions (used on page load). */
    public Optional<AccountDto> getAccount(String accountId) {
        return accountRepo.findById(UUID.fromString(accountId)).map(acc -> {
            List<String> subs = customerRepo.findByAccountId(acc.getId())
                    .stream()
                    .map(c -> tenantRepo.findById(c.getTenantId())
                            .map(t -> t.getSlug()).orElse(null))
                    .filter(s -> s != null)
                    .toList();
            return new AccountDto(acc.getId().toString(), acc.getEmail(),
                    acc.getFullName(), acc.getAvatarUrl(), subs);
        });
    }

    // ─── Subscribe to a tenant ────────────────────────────────────────────────

    /**
     * Subscribes the account to a tenant store. Idempotent.
     * Returns the customer record and whether this was a new subscription.
     */
    @Transactional
    public Optional<SubscribeResult> subscribe(String accountId, String tenantSlug) {
        var accOpt = accountRepo.findById(UUID.fromString(accountId));
        var tenantOpt = tenantRepo.findBySlug(tenantSlug);
        if (accOpt.isEmpty() || tenantOpt.isEmpty()) return Optional.empty();

        MarketplaceAccountEntity acc = accOpt.get();
        UUID tenantId = tenantOpt.get().getId();

        boolean isNew = false;
        CustomerEntity c = customerRepo
                .findByAccountIdAndTenantId(acc.getId(), tenantId)
                .orElseGet(() -> {
                    CustomerEntity n = new CustomerEntity();
                    n.setAccountId(acc.getId());
                    n.setTenantId(tenantId);
                    n.setEmail(acc.getEmail());
                    n.setGoogleSub(acc.getGoogleSub());
                    n.setAvatarUrl(acc.getAvatarUrl());
                    n.setTotalSpent(BigDecimal.ZERO);
                    return n;
                });

        boolean creating = c.getId() == null;
        c.setFullName(acc.getFullName());
        c = customerRepo.save(c);

        return Optional.of(new SubscribeResult(toDto(c), creating));
    }

    // ─── Check subscription ───────────────────────────────────────────────────

    public boolean isSubscribed(String accountId, String tenantSlug) {
        try {
            return tenantRepo.findBySlug(tenantSlug)
                    .map(t -> customerRepo
                            .findByAccountIdAndTenantId(UUID.fromString(accountId), t.getId())
                            .isPresent())
                    .orElse(false);
        } catch (Exception e) {
            return false;
        }
    }

    // ─── Shared toDto ─────────────────────────────────────────────────────────

    private CustomerDto toDto(CustomerEntity e) {
        double spent = e.getTotalSpent() == null ? 0 : e.getTotalSpent().doubleValue();
        String loyalty = spent >= 3000 ? "platinum" : spent >= 1000 ? "gold"
                : spent >= 500 ? "silver" : "bronze";
        return new CustomerDto(
                e.getId().toString(), e.getFullName(), e.getEmail(),
                e.getPhone(), e.getAvatarUrl(), e.getTotalOrders(),
                spent, e.getLoyaltyPoints(), loyalty,
                e.getCreatedAt() != null ? e.getCreatedAt().toLocalDate().toString() : null
        );
    }
}
