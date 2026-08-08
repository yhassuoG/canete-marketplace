package com.canete.marketplace.modules.coupon.infrastructure.web;

import com.canete.marketplace.modules.coupon.application.CouponDto;
import com.canete.marketplace.modules.coupon.application.CouponService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/coupons")
@CrossOrigin(origins = "*")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    /** GET /api/v1/coupons?tenantSlug=muelle-pacifico */
    @GetMapping
    public ResponseEntity<List<CouponDto>> list(@RequestParam String tenantSlug) {
        return ResponseEntity.ok(couponService.listByTenantSlug(tenantSlug));
    }
}
