package com.canete.marketplace.modules.coupon.application;

import java.util.List;
import com.canete.marketplace.modules.coupon.infrastructure.persistence.CouponRepository;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.TenantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CouponService {

    private final CouponRepository couponRepository;
    private final TenantRepository tenantRepository;

    public CouponService(CouponRepository couponRepository, TenantRepository tenantRepository) {
        this.couponRepository = couponRepository;
        this.tenantRepository = tenantRepository;
    }

    @Transactional(readOnly = true)
    public List<CouponDto> listByTenantSlug(String tenantSlug) {
        return tenantRepository.findBySlug(tenantSlug)
                .map(t -> couponRepository.findByTenantIdOrderByCreatedAtDesc(t.getId())
                        .stream().map(CouponDto::from).toList())
                .orElse(List.of());
    }
}
