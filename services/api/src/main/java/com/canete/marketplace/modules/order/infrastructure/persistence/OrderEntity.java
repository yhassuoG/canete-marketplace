package com.canete.marketplace.modules.order.infrastructure.persistence;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
public class OrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "customer_id")
    private UUID customerId;

    @Column(name = "customer_name", nullable = false, length = 120)
    private String customerName;

    @Column(name = "customer_phone", length = 30)
    private String customerPhone;

    @Column(name = "customer_address", columnDefinition = "TEXT")
    private String customerAddress;

    @Column(nullable = false)
    private String status = "pending";

    @Column(name = "delivery_type", nullable = false)
    private String deliveryType = "delivery";

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "payment_reference", length = 100)
    private String paymentReference;

    @Column(nullable = false)
    private BigDecimal subtotal;

    @Column(name = "delivery_fee", nullable = false)
    private BigDecimal deliveryFee = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal total;

    @Column(name = "coupon_id")
    private UUID couponId;

    // ── Mercado Pago ──────────────────────────────────────────────────────
    /** ID de la preferencia de pago creada en Mercado Pago. */
    @Column(name = "mp_preference_id", length = 100)
    private String mpPreferenceId;

    /** ID del pago asignado por Mercado Pago (una vez procesado). */
    @Column(name = "mp_payment_id")
    private Long mpPaymentId;

    /** Estado del pago en MP: pending | approved | rejected | cancelled | refunded. */
    @Column(name = "mp_payment_status", length = 30)
    private String mpPaymentStatus;

    /** URL de checkout (init_point) devuelta por MP para redirigir al cliente. */
    @Column(name = "mp_init_point", columnDefinition = "TEXT")
    private String mpInitPoint;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "delivered_at")
    private OffsetDateTime deliveredAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<OrderItemEntity> items = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) this.status = "pending";
        if (this.deliveryType == null) this.deliveryType = "delivery";
        if (this.deliveryFee == null) this.deliveryFee = BigDecimal.ZERO;
        if (this.discount == null) this.discount = BigDecimal.ZERO;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
        if ("delivered".equals(this.status) && this.deliveredAt == null) {
            this.deliveredAt = OffsetDateTime.now();
        }
    }

    // Getters and setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getCustomerAddress() { return customerAddress; }
    public void setCustomerAddress(String customerAddress) { this.customerAddress = customerAddress; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDeliveryType() { return deliveryType; }
    public void setDeliveryType(String deliveryType) { this.deliveryType = deliveryType; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getDeliveryFee() { return deliveryFee; }
    public void setDeliveryFee(BigDecimal deliveryFee) { this.deliveryFee = deliveryFee; }

    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }

    public UUID getCouponId() { return couponId; }
    public void setCouponId(UUID couponId) { this.couponId = couponId; }

    public String getMpPreferenceId() { return mpPreferenceId; }
    public void setMpPreferenceId(String mpPreferenceId) { this.mpPreferenceId = mpPreferenceId; }

    public Long getMpPaymentId() { return mpPaymentId; }
    public void setMpPaymentId(Long mpPaymentId) { this.mpPaymentId = mpPaymentId; }

    public String getMpPaymentStatus() { return mpPaymentStatus; }
    public void setMpPaymentStatus(String mpPaymentStatus) { this.mpPaymentStatus = mpPaymentStatus; }

    public String getMpInitPoint() { return mpInitPoint; }
    public void setMpInitPoint(String mpInitPoint) { this.mpInitPoint = mpInitPoint; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    public OffsetDateTime getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(OffsetDateTime deliveredAt) { this.deliveredAt = deliveredAt; }

    public List<OrderItemEntity> getItems() { return items; }
    public void setItems(List<OrderItemEntity> items) { this.items = items; }
}
