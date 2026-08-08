package com.canete.marketplace.modules.user.application;

import com.canete.marketplace.modules.user.infrastructure.persistence.UserEntity;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserDto(
    UUID id,
    String email,
    String fullName,
    String role,
    String status,
    String tenantSlug,
    LocalDateTime lastLoginAt,
    LocalDateTime createdAt
) {
    public static UserDto from(UserEntity e) {
        return new UserDto(
            e.getId(),
            e.getEmail(),
            e.getFullName(),
            e.getRole(),
            e.getStatus(),
            e.getTenantSlug(),
            e.getLastLoginAt(),
            e.getCreatedAt()
        );
    }
}
