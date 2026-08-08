package com.canete.marketplace.modules.tenant.infrastructure.persistence;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidad JPA para la tabla {@code plans}.
 * Representa los planes de suscripción disponibles:
 * free, trial, starter, premium (Pro), enterprise.
 */
@Entity
@Table(name = "plans")
public class PlanEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "price_monthly", precision = 10, scale = 2, nullable = false)
    private BigDecimal priceMonthly;

    @Column(name = "max_products", nullable = false)
    private int maxProducts;

    @Column(name = "max_orders_per_month", nullable = false)
    private int maxOrdersPerMonth;

    @Column(name = "trial_days", nullable = false)
    private int trialDays;

    @Column(name = "has_mp", nullable = false)
    private Boolean hasMp = true;

    @Column(name = "max_mp_sales_month", nullable = false)
    private int maxMpSalesMonth = -1;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Getters ──────────────────────────────────────────────────────────────

    public UUID getId()                    { return id; }
    public String getName()                { return name; }
    public String getDisplayName()         { return displayName; }
    public BigDecimal getPriceMonthly()    { return priceMonthly; }
    public int getMaxProducts()            { return maxProducts; }
    public int getMaxOrdersPerMonth()      { return maxOrdersPerMonth; }
    public int getTrialDays()              { return trialDays; }
    public Boolean getHasMp()              { return hasMp; }
    public int getMaxMpSalesMonth()        { return maxMpSalesMonth; }
    public Boolean getIsActive()           { return isActive; }
    public int getSortOrder()              { return sortOrder; }
    public LocalDateTime getCreatedAt()    { return createdAt; }
    public LocalDateTime getUpdatedAt()    { return updatedAt; }

    // ── Setters ───────────────────────────────────────────────────────────────

    public void setName(String name)                    { this.name = name; }
    public void setDisplayName(String displayName)      { this.displayName = displayName; }
    public void setPriceMonthly(BigDecimal priceMonthly){ this.priceMonthly = priceMonthly; }
    public void setMaxProducts(int maxProducts)         { this.maxProducts = maxProducts; }
    public void setMaxOrdersPerMonth(int v)             { this.maxOrdersPerMonth = v; }
    public void setTrialDays(int trialDays)             { this.trialDays = trialDays; }
    public void setHasMp(Boolean hasMp)                 { this.hasMp = hasMp; }
    public void setMaxMpSalesMonth(int v)               { this.maxMpSalesMonth = v; }
    public void setIsActive(Boolean isActive)           { this.isActive = isActive; }
    public void setSortOrder(int sortOrder)             { this.sortOrder = sortOrder; }
    public void setUpdatedAt(LocalDateTime updatedAt)   { this.updatedAt = updatedAt; }
}
