package com.canete.marketplace.modules.reservation.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ReservationRepository extends JpaRepository<ReservationEntity, UUID> {

    List<ReservationEntity> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
}
