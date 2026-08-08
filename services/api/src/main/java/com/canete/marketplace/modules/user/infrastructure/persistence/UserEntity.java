package com.canete.marketplace.modules.user.infrastructure.persistence;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String role;                // admin | business_owner | customer

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "tenant_slug")
    private String tenantSlug;

    @Column(nullable = false)
    private String status;              // active | suspended

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Getters ──────────────────────────────────────────────────────────────

    public UUID getId()                     { return id; }
    public String getEmail()                { return email; }
    public String getPasswordHash()         { return passwordHash; }
    public String getFullName()             { return fullName; }
    public String getRole()                 { return role; }
    public UUID getTenantId()               { return tenantId; }
    public String getTenantSlug()           { return tenantSlug; }
    public String getStatus()               { return status; }
    public LocalDateTime getLastLoginAt()   { return lastLoginAt; }
    public LocalDateTime getCreatedAt()     { return createdAt; }

    // ── Setters ───────────────────────────────────────────────────────────────

    public void setEmail(String email)                 { this.email = email; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public void setFullName(String fullName)         { this.fullName = fullName; }
    public void setRole(String role)                 { this.role = role; }
    public void setTenantId(UUID tenantId)           { this.tenantId = tenantId; }
    public void setTenantSlug(String tenantSlug)     { this.tenantSlug = tenantSlug; }
    public void setStatus(String status)             { this.status = status; }
    public void setLastLoginAt(LocalDateTime t)       { this.lastLoginAt = t; }
    public void setUpdatedAt(LocalDateTime t)         { this.updatedAt = t; }
}
