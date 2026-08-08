package com.canete.marketplace.modules.coupon.application;

import com.canete.marketplace.modules.coupon.infrastructure.persistence.CouponEntity;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CouponDto(
    UUID id,
    UUID tenantId,
    String code,
    String type,
    BigDecimal value,
    BigDecimal minOrder,
    Integer maxUses,
    int usedCount,
    LocalDate validFrom,
    LocalDate validUntil,
    boolean isActive
) {
    public static CouponDto from(CouponEntity e) {
        return new CouponDto(
            e.getId(),
            e.getTenantId(),
            e.getCode(),
            e.getType(),
            e.getValue(),
            e.getMinOrder(),
            e.getMaxUses(),
            e.getUsedCount(),
            e.getValidFrom(),
            e.getValidUntil(),
            e.isActive()
        );
    }
}
