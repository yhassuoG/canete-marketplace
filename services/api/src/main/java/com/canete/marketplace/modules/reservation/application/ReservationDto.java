package com.canete.marketplace.modules.reservation.application;

import com.canete.marketplace.modules.reservation.infrastructure.persistence.ReservationEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record ReservationDto(
    UUID id,
    UUID tenantId,
    UUID customerId,
    String customerName,
    String customerEmail,
    String customerPhone,
    String serviceType,
    int guests,
    LocalDate reservationDate,
    LocalTime reservationTime,
    String status,
    BigDecimal subtotal,
    BigDecimal serviceFee,
    BigDecimal total,
    String notes
) {
    public static ReservationDto from(ReservationEntity e) {
        return new ReservationDto(
            e.getId(),
            e.getTenantId(),
            e.getCustomerId(),
            e.getCustomerName(),
            e.getCustomerEmail(),
            e.getCustomerPhone(),
            e.getServiceType(),
            e.getGuests(),
            e.getReservationDate(),
            e.getReservationTime(),
            e.getStatus(),
            e.getSubtotal(),
            e.getServiceFee(),
            e.getTotal(),
            e.getNotes()
        );
    }
}
