package com.canete.marketplace.modules.coupon.infrastructure.persistence;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponRepository extends JpaRepository<CouponEntity, UUID> {
    List<CouponEntity> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
}
