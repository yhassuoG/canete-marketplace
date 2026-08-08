package com.canete.marketplace.modules.reservation.application;

import java.math.BigDecimal;
import java.util.List;
import com.canete.marketplace.modules.reservation.infrastructure.persistence.ReservationRepository;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.TenantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final TenantRepository tenantRepository;

    public ReservationService(ReservationRepository reservationRepository,
                              TenantRepository tenantRepository) {
        this.reservationRepository = reservationRepository;
        this.tenantRepository = tenantRepository;
    }

    public ReservationQuote quote(String tenantSlug, String serviceType, int guests) {
        var subtotal = BigDecimal.valueOf(guests).multiply(BigDecimal.valueOf(89));
        var fee = subtotal.multiply(BigDecimal.valueOf(0.12));
        return new ReservationQuote(tenantSlug, serviceType, guests, subtotal, fee, subtotal.add(fee));
    }

    @Transactional(readOnly = true)
    public List<ReservationDto> listByTenantSlug(String tenantSlug) {
        return tenantRepository.findBySlug(tenantSlug)
                .map(t -> reservationRepository.findByTenantIdOrderByCreatedAtDesc(t.getId())
                        .stream().map(ReservationDto::from).toList())
                .orElse(List.of());
    }
}
