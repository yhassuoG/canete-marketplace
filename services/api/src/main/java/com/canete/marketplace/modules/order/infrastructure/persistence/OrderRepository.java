package com.canete.marketplace.modules.order.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {

    List<OrderEntity> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<OrderEntity> findByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, String status);

    List<OrderEntity> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
}
