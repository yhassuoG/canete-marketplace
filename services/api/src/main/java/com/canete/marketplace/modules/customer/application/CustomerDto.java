package com.canete.marketplace.modules.customer.application;

public record CustomerDto(
    String id,
    String name,
    String email,
    String phone,
    String avatarUrl,
    int    visits,
    double spent,
    int    loyaltyPoints,
    String loyalty,      // bronze | silver | gold | platinum
    String joinedDate
) {}
