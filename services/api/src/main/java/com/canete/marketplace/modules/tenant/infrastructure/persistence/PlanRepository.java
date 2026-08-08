package com.canete.marketplace.modules.tenant.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlanRepository extends JpaRepository<PlanEntity, UUID> {
    Optional<PlanEntity> findByName(String name);
    List<PlanEntity> findByIsActiveTrueOrderBySortOrderAsc();
}
