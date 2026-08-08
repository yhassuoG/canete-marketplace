package com.canete.marketplace.modules.customer.application;

import com.canete.marketplace.modules.customer.infrastructure.persistence.CustomerEntity;
import com.canete.marketplace.modules.customer.infrastructure.persistence.CustomerRepository;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.TenantRepository;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CustomerService {

    private final CustomerRepository customerRepo;
    private final TenantRepository tenantRepo;

    public CustomerService(CustomerRepository customerRepo, TenantRepository tenantRepo) {
        this.customerRepo = customerRepo;
        this.tenantRepo   = tenantRepo;
    }

    /** Returns all customers for a tenant, ordered by total_spent desc. */
    public List<CustomerDto> listByTenantSlug(String tenantSlug) {
        return tenantRepo.findBySlug(tenantSlug)
                .map(t -> customerRepo.findByTenantIdOrderByTotalSpentDesc(t.getId())
                        .stream().map(this::toDto).toList())
                .orElse(List.of());
    }

    /** Returns all customers across all tenants. */
    public List<CustomerDto> listAll() {
        return customerRepo.findAll().stream().map(this::toDto).toList();
    }

    /** Upsert customer by email within a tenant (called after Google auth). */
    public CustomerDto upsert(UUID tenantId, String email, String fullName,
                              String googleSub, String avatarUrl) {
        CustomerEntity c = customerRepo.findByTenantIdAndEmail(tenantId, email)
                .orElseGet(() -> {
                    CustomerEntity n = new CustomerEntity();
                    n.setTenantId(tenantId);
                    n.setEmail(email);
                    n.setTotalSpent(BigDecimal.ZERO);
                    return n;
                });

        c.setFullName(fullName);
        if (googleSub != null)  c.setGoogleSub(googleSub);
        if (avatarUrl != null)  c.setAvatarUrl(avatarUrl);

        return toDto(customerRepo.save(c));
    }

    /** Find tenant UUID by slug (used by CustomerAuthController). */
    public Optional<UUID> resolveTenantId(String tenantSlug) {
        return tenantRepo.findBySlug(tenantSlug).map(t -> t.getId());
    }

    private CustomerDto toDto(CustomerEntity e) {
        double spent = e.getTotalSpent() == null ? 0 : e.getTotalSpent().doubleValue();
        String loyalty = spent >= 3000 ? "platinum" : spent >= 1000 ? "gold" : spent >= 500 ? "silver" : "bronze";
        return new CustomerDto(
                e.getId().toString(),
                e.getFullName(),
                e.getEmail(),
                e.getPhone(),
                e.getAvatarUrl(),
                e.getTotalOrders(),
                spent,
                e.getLoyaltyPoints(),
                loyalty,
                e.getCreatedAt() != null ? e.getCreatedAt().toLocalDate().toString() : null
        );
    }
}
