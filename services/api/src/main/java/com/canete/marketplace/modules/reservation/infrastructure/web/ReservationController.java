package com.canete.marketplace.modules.reservation.infrastructure.web;

import com.canete.marketplace.modules.reservation.application.ReservationDto;
import com.canete.marketplace.modules.reservation.application.ReservationQuote;
import com.canete.marketplace.modules.reservation.application.ReservationService;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/v1/reservations")
@org.springframework.web.bind.annotation.CrossOrigin(origins = "*")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping("/quote")
    public ReservationQuote quote(
        @RequestParam @NotBlank String tenantSlug,
        @RequestParam(defaultValue = "experience") String serviceType,
        @RequestParam(defaultValue = "2") @Min(1) int guests
    ) {
        return reservationService.quote(tenantSlug, serviceType, guests);
    }

    /** GET /api/v1/reservations?tenantSlug=muelle-pacifico */
    @GetMapping
    public ResponseEntity<List<ReservationDto>> list(@RequestParam String tenantSlug) {
        return ResponseEntity.ok(reservationService.listByTenantSlug(tenantSlug));
    }
}
