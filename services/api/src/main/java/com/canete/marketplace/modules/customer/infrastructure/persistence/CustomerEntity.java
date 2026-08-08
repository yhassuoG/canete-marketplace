package com.canete.marketplace.modules.customer.infrastructure.persistence;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "customers")
public class CustomerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    private String email;
    private String phone;
    private String address;

    @Column(name = "account_id")
    private UUID accountId;

    @Column(name = "google_sub")
    private String googleSub;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "total_orders")
    private int totalOrders;

    @Column(name = "total_spent", precision = 12, scale = 2)
    private BigDecimal totalSpent;

    @Column(name = "loyalty_points")
    private int loyaltyPoints;

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

    public UUID getId()                        { return id; }
    public UUID getTenantId()                  { return tenantId; }
    public void setTenantId(UUID tenantId)     { this.tenantId = tenantId; }
    public String getFullName()                { return fullName; }
    public void setFullName(String fullName)   { this.fullName = fullName; }
    public String getEmail()                   { return email; }
    public void setEmail(String email)         { this.email = email; }
    public String getPhone()                   { return phone; }
    public void setPhone(String phone)         { this.phone = phone; }
    public String getAddress()                 { return address; }
    public void setAddress(String address)     { this.address = address; }
    public UUID getAccountId()               { return accountId; }
    public void setAccountId(UUID accountId) { this.accountId = accountId; }
    public String getGoogleSub()               { return googleSub; }
    public void setGoogleSub(String googleSub) { this.googleSub = googleSub; }
    public String getAvatarUrl()               { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public int getTotalOrders()                { return totalOrders; }
    public void setTotalOrders(int totalOrders){ this.totalOrders = totalOrders; }
    public BigDecimal getTotalSpent()          { return totalSpent; }
    public void setTotalSpent(BigDecimal v)    { this.totalSpent = v; }
    public int getLoyaltyPoints()              { return loyaltyPoints; }
    public void setLoyaltyPoints(int v)        { this.loyaltyPoints = v; }
    public LocalDateTime getCreatedAt()        { return createdAt; }
    public void setCreatedAt(LocalDateTime v)  { this.createdAt = v; }
    public LocalDateTime getUpdatedAt()        { return updatedAt; }
    public void setUpdatedAt(LocalDateTime v)  { this.updatedAt = v; }
}
