package com.canete.marketplace.modules.customer.infrastructure.persistence;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Global marketplace account — one per real person regardless of tenant.
 * Created when a user first signs in with Google on the main marketplace page.
 */
@Entity
@Table(name = "marketplace_accounts")
public class MarketplaceAccountEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "google_sub", unique = true)
    private String googleSub;

    @Column(nullable = false)
    private String email;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ─── Getters & Setters ────────────────────────────────────────────────────
    public UUID getId()                          { return id; }
    public String getGoogleSub()                 { return googleSub; }
    public void setGoogleSub(String googleSub)   { this.googleSub = googleSub; }
    public String getEmail()                     { return email; }
    public void setEmail(String email)           { this.email = email; }
    public String getFullName()                  { return fullName; }
    public void setFullName(String fullName)     { this.fullName = fullName; }
    public String getAvatarUrl()                 { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl)   { this.avatarUrl = avatarUrl; }
    public LocalDateTime getCreatedAt()          { return createdAt; }
    public LocalDateTime getUpdatedAt()          { return updatedAt; }
}
