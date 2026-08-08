package com.canete.marketplace.modules.customer.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CustomerRepository extends JpaRepository<CustomerEntity, UUID> {
    List<CustomerEntity> findByTenantIdOrderByTotalSpentDesc(UUID tenantId);
    Optional<CustomerEntity> findByTenantIdAndEmail(UUID tenantId, String email);
    Optional<CustomerEntity> findByGoogleSub(String googleSub);
    List<CustomerEntity> findByAccountId(UUID accountId);
    Optional<CustomerEntity> findByAccountIdAndTenantId(UUID accountId, UUID tenantId);
}
