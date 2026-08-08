package com.canete.marketplace.modules.tenant.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface TenantSubscriptionRepository extends JpaRepository<TenantSubscriptionEntity, UUID> {
    Optional<TenantSubscriptionEntity> findByTenantId(UUID tenantId);
}
