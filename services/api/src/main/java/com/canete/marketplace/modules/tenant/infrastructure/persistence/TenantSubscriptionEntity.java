package com.canete.marketplace.modules.tenant.infrastructure.persistence;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidad JPA para la tabla {@code tenant_subscriptions}.
 * Tracking del plan actual del tenant, trial y suscripción paga.
 */
@Entity
@Table(name = "tenant_subscriptions")
public class TenantSubscriptionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, unique = true)
    private UUID tenantId;

    /** Plan actual: free, trial, starter, premium, enterprise */
    @Column(name = "current_plan", nullable = false)
    private String currentPlan = "trial";

    // ── Trial tracking ──────────────────────────────────────────────────────

    @Column(name = "trial_started_at")
    private LocalDateTime trialStartedAt;

    @Column(name = "trial_ends_at")
    private LocalDateTime trialEndsAt;

    @Column(name = "trial_used", nullable = false)
    private Boolean trialUsed = false;

    // ── Suscripción paga ────────────────────────────────────────────────────

    @Column(name = "subscription_started_at")
    private LocalDateTime subscriptionStartedAt;

    @Column(name = "subscription_renewal_at")
    private LocalDateTime subscriptionRenewalAt;

    /** none, active, past_due, cancelled */
    @Column(name = "subscription_status", nullable = false)
    private String subscriptionStatus = "none";

    // ── Contador de ventas MP del mes ───────────────────────────────────────

    @Column(name = "mp_sales_this_month", nullable = false)
    private int mpSalesThisMonth = 0;

    @Column(name = "mp_sales_reset_at")
    private LocalDateTime mpSalesResetAt;

    // ── Metadata ────────────────────────────────────────────────────────────

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Getters ──────────────────────────────────────────────────────────────

    public UUID getId()                          { return id; }
    public UUID getTenantId()                    { return tenantId; }
    public String getCurrentPlan()               { return currentPlan; }
    public LocalDateTime getTrialStartedAt()     { return trialStartedAt; }
    public LocalDateTime getTrialEndsAt()        { return trialEndsAt; }
    public Boolean getTrialUsed()                { return trialUsed; }
    public LocalDateTime getSubscriptionStartedAt() { return subscriptionStartedAt; }
    public LocalDateTime getSubscriptionRenewalAt() { return subscriptionRenewalAt; }
    public String getSubscriptionStatus()        { return subscriptionStatus; }
    public int getMpSalesThisMonth()             { return mpSalesThisMonth; }
    public LocalDateTime getMpSalesResetAt()     { return mpSalesResetAt; }
    public LocalDateTime getCreatedAt()          { return createdAt; }
    public LocalDateTime getUpdatedAt()          { return updatedAt; }

    // ── Setters ───────────────────────────────────────────────────────────────

    public void setTenantId(UUID tenantId)                   { this.tenantId = tenantId; }
    public void setCurrentPlan(String currentPlan)           { this.currentPlan = currentPlan; }
    public void setTrialStartedAt(LocalDateTime t)           { this.trialStartedAt = t; }
    public void setTrialEndsAt(LocalDateTime t)              { this.trialEndsAt = t; }
    public void setTrialUsed(Boolean trialUsed)              { this.trialUsed = trialUsed; }
    public void setSubscriptionStartedAt(LocalDateTime t)    { this.subscriptionStartedAt = t; }
    public void setSubscriptionRenewalAt(LocalDateTime t)    { this.subscriptionRenewalAt = t; }
    public void setSubscriptionStatus(String s)              { this.subscriptionStatus = s; }
    public void setMpSalesThisMonth(int v)                   { this.mpSalesThisMonth = v; }
    public void setMpSalesResetAt(LocalDateTime t)           { this.mpSalesResetAt = t; }
}
