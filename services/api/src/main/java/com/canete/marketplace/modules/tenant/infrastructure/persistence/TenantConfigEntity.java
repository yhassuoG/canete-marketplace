package com.canete.marketplace.modules.tenant.infrastructure.persistence;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenant_config")
public class TenantConfigEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, unique = true)
    private UUID tenantId;

    @Column(precision = 10, scale = 7)
    private BigDecimal lat;

    @Column(precision = 10, scale = 7)
    private BigDecimal lng;

    private String address;

    @Column(name = "allows_delivery", nullable = false)
    private Boolean allowsDelivery = true;

    @Column(name = "allows_pickup", nullable = false)
    private Boolean allowsPickup = true;

    @Column(name = "delivery_fee", precision = 10, scale = 2)
    private BigDecimal deliveryFee = BigDecimal.ZERO;

    @Column(name = "yape_phone", length = 20)
    private String yapePhone;

    @Column(name = "yape_qr_url", length = 500)
    private String yapeQrUrl;

    @Column(name = "banner_url", length = 500)
    private String bannerUrl;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    // ── Mercado Pago (credenciales por tenant) ──────────────────────────────
    // Cada tenant configura SUS PROPIAS credenciales. El dinero va directo
    // a la cuenta MP del tenant, no a una cuenta central.

    @Column(name = "mp_access_token", length = 200)
    private String mpAccessToken;

    @Column(name = "mp_public_key", length = 200)
    private String mpPublicKey;

    @Column(name = "mp_user_id", length = 50)
    private String mpUserId;

    @Column(name = "mp_sandbox", nullable = false)
    private Boolean mpSandbox = true;

    @Column(name = "mp_enabled", nullable = false)
    private Boolean mpEnabled = false;

    @Column(name = "mp_updated_at")
    private LocalDateTime mpUpdatedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Getters ──────────────────────────────────────────────────────────────

    public UUID getId()           { return id; }
    public UUID getTenantId()     { return tenantId; }
    public BigDecimal getLat()    { return lat; }
    public BigDecimal getLng()    { return lng; }
    public String getAddress()    { return address; }
    public Boolean getAllowsDelivery() { return allowsDelivery; }
    public Boolean getAllowsPickup()   { return allowsPickup; }
    public BigDecimal getDeliveryFee() { return deliveryFee; }
    public String getYapePhone()       { return yapePhone; }
    public String getYapeQrUrl()       { return yapeQrUrl; }
    public String getBannerUrl()       { return bannerUrl; }
    public String getLogoUrl()         { return logoUrl; }
    public String getMpAccessToken()   { return mpAccessToken; }
    public String getMpPublicKey()     { return mpPublicKey; }
    public String getMpUserId()        { return mpUserId; }
    public Boolean getMpSandbox()      { return mpSandbox; }
    public Boolean getMpEnabled()      { return mpEnabled; }
    public LocalDateTime getMpUpdatedAt() { return mpUpdatedAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // ── Setters ───────────────────────────────────────────────────────────────

    public void setTenantId(UUID tenantId)    { this.tenantId = tenantId; }
    public void setLat(BigDecimal lat)        { this.lat = lat; }
    public void setLng(BigDecimal lng)        { this.lng = lng; }
    public void setAddress(String address)    { this.address = address; }
    public void setAllowsDelivery(Boolean v)  { this.allowsDelivery = v; }
    public void setAllowsPickup(Boolean v)    { this.allowsPickup = v; }
    public void setDeliveryFee(BigDecimal v)  { this.deliveryFee = v; }
    public void setYapePhone(String v)        { this.yapePhone = v; }
    public void setYapeQrUrl(String v)        { this.yapeQrUrl = v; }
    public void setBannerUrl(String v)        { this.bannerUrl = v; }
    public void setLogoUrl(String v)          { this.logoUrl = v; }
    public void setMpAccessToken(String v)    { this.mpAccessToken = v; }
    public void setMpPublicKey(String v)      { this.mpPublicKey = v; }
    public void setMpUserId(String v)         { this.mpUserId = v; }
    public void setMpSandbox(Boolean v)       { this.mpSandbox = v; }
    public void setMpEnabled(Boolean v)       { this.mpEnabled = v; }
    public void setMpUpdatedAt(LocalDateTime t) { this.mpUpdatedAt = t; }
    public void setUpdatedAt(LocalDateTime t) { this.updatedAt = t; }
}
