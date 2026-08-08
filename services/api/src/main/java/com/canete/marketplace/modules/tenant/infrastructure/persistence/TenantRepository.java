package com.canete.marketplace.modules.tenant.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TenantRepository extends JpaRepository<TenantEntity, UUID> {
    Optional<TenantEntity> findBySlug(String slug);
    List<TenantEntity> findByStatus(String status);
    boolean existsBySlug(String slug);
}
