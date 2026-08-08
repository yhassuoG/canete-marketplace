package com.canete.marketplace.modules.tenant.infrastructure.persistence;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenants")
public class TenantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String name;

    private String tagline;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String category;

    private String location;
    private String phone;

    @Column(name = "primary_color")
    private String primaryColor;

    private String gradient;

    @Column(name = "plan_id")
    private UUID planId;

    @Column(nullable = false)
    private String status;

    @Column(precision = 3, scale = 2)
    private BigDecimal rating;

    @Column(name = "review_count")
    private int reviewCount;

    @Column(name = "monthly_revenue", precision = 12, scale = 2)
    private BigDecimal monthlyRevenue;

    @Column(name = "reservations_this_month")
    private int reservationsThisMonth;

    @Column(name = "orders_this_month")
    private int ordersThisMonth;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Getters ──────────────────────────────────────────────────────────────

    public UUID getId()                   { return id; }
    public String getSlug()               { return slug; }
    public String getName()               { return name; }
    public String getTagline()            { return tagline; }
    public String getDescription()        { return description; }
    public String getCategory()           { return category; }
    public String getLocation()           { return location; }
    public String getPhone()              { return phone; }
    public String getPrimaryColor()       { return primaryColor; }
    public String getGradient()           { return gradient; }
    public UUID getPlanId()               { return planId; }
    public String getStatus()             { return status; }
    public BigDecimal getRating()         { return rating; }
    public int getReviewCount()           { return reviewCount; }
    public BigDecimal getMonthlyRevenue() { return monthlyRevenue; }
    public int getReservationsThisMonth() { return reservationsThisMonth; }
    public int getOrdersThisMonth()       { return ordersThisMonth; }
    public LocalDateTime getCreatedAt()   { return createdAt; }

    // ── Setters (needed by JPA) ───────────────────────────────────────────────

    public void setSlug(String slug)              { this.slug = slug; }
    public void setName(String name)              { this.name = name; }
    public void setTagline(String tagline)        { this.tagline = tagline; }
    public void setDescription(String description){ this.description = description; }
    public void setCategory(String category)      { this.category = category; }
    public void setPhone(String phone)            { this.phone = phone; }
    public void setLocation(String location)      { this.location = location; }
    public void setPrimaryColor(String color)     { this.primaryColor = color; }
    public void setGradient(String gradient)      { this.gradient = gradient; }
    public void setPlanId(UUID planId)            { this.planId = planId; }
    public void setStatus(String status)          { this.status = status; }
    public void setRating(BigDecimal rating)      { this.rating = rating; }
    public void setReviewCount(int reviewCount)   { this.reviewCount = reviewCount; }
    public void setMonthlyRevenue(BigDecimal revenue) { this.monthlyRevenue = revenue; }
    public void setReservationsThisMonth(int reservationsThisMonth) { this.reservationsThisMonth = reservationsThisMonth; }
    public void setOrdersThisMonth(int ordersThisMonth) { this.ordersThisMonth = ordersThisMonth; }
    public void setCreatedAt(LocalDateTime t)     { this.createdAt = t; }
    public void setUpdatedAt(LocalDateTime t)     { this.updatedAt = t; }
}
