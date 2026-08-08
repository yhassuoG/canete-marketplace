package com.canete.marketplace.modules.coupon.infrastructure.persistence;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "coupons")
public class CouponEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(nullable = false)
    private String type = "percentage";

    @Column(nullable = false)
    private BigDecimal value;

    @Column(name = "min_order", nullable = false)
    private BigDecimal minOrder = BigDecimal.ZERO;

    @Column(name = "max_uses")
    private Integer maxUses;

    @Column(name = "used_count", nullable = false)
    private int usedCount = 0;

    @Column(name = "valid_from", nullable = false)
    private LocalDate validFrom;

    @Column(name = "valid_until", nullable = false)
    private LocalDate validUntil;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public UUID getId() { return id; }
    public UUID getTenantId() { return tenantId; }
    public String getCode() { return code; }
    public String getType() { return type; }
    public BigDecimal getValue() { return value; }
    public BigDecimal getMinOrder() { return minOrder; }
    public Integer getMaxUses() { return maxUses; }
    public int getUsedCount() { return usedCount; }
    public LocalDate getValidFrom() { return validFrom; }
    public LocalDate getValidUntil() { return validUntil; }
    public boolean isActive() { return isActive; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
