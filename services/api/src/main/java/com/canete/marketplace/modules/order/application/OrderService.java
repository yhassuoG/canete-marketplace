package com.canete.marketplace.modules.order.application;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.canete.marketplace.modules.order.infrastructure.persistence.OrderEntity;
import com.canete.marketplace.modules.order.infrastructure.persistence.OrderItemEntity;
import com.canete.marketplace.modules.order.infrastructure.persistence.OrderRepository;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final WhatsAppNotificationService whatsappService;
    private final MercadoPagoService mercadoPagoService;

    public OrderService(
            OrderRepository orderRepository,
            WhatsAppNotificationService whatsappService,
            MercadoPagoService mercadoPagoService
    ) {
        this.orderRepository = orderRepository;
        this.whatsappService = whatsappService;
        this.mercadoPagoService = mercadoPagoService;
    }

    // ==================== REAL ORDER CRUD ====================

    /**
     * Valida el código de operación (paymentReference) para pagos con Yape/Plin.
     * Reglas: obligatorio, 6-20 caracteres, solo dígitos.
     * Lanza IllegalArgumentException (→ 400 Bad Request) si es inválido.
     */
    private void validatePaymentReference(String paymentMethod, String paymentReference) {
        if (paymentMethod == null) return;
        boolean needsRef = "yape".equalsIgnoreCase(paymentMethod)
                || "plin".equalsIgnoreCase(paymentMethod);
        if (!needsRef) return;

        if (paymentReference == null || paymentReference.isBlank()) {
            throw new IllegalArgumentException(
                    "El código de operación es obligatorio para pagos con Yape/Plin");
        }
        String trimmed = paymentReference.trim();
        if (!trimmed.matches("\\d+")) {
            throw new IllegalArgumentException(
                    "El código de operación debe contener solo dígitos (0-9)");
        }
        if (trimmed.length() < 6 || trimmed.length() > 20) {
            throw new IllegalArgumentException(
                    "El código de operación debe tener entre 6 y 20 dígitos");
        }
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest req) {
        // Validar código de operación para Yape/Plin (solo si no usa Mercado Pago)
        // Si el paymentMethod es "mercadopago", la validación se hace en MP.
        if (!"mercadopago".equalsIgnoreCase(req.paymentMethod())) {
            validatePaymentReference(req.paymentMethod(), req.paymentReference());
        }

        OrderEntity order = new OrderEntity();
        order.setTenantId(req.tenantId());
        order.setCustomerId(req.customerId());
        order.setCustomerName(req.customerName());
        order.setCustomerPhone(req.customerPhone());
        order.setCustomerAddress(req.customerAddress());
        order.setDeliveryType(req.deliveryType());
        order.setPaymentMethod(req.paymentMethod());
        order.setPaymentReference(req.paymentReference());
        order.setNotes(req.notes());
        // Si paga con Mercado Pago, el pedido queda "pending_payment" hasta confirmación
        order.setStatus("mercadopago".equalsIgnoreCase(req.paymentMethod())
                ? "pending_payment" : "pending");

        // Calculate subtotal from items
        BigDecimal subtotal = BigDecimal.ZERO;
        for (var itemDto : req.items()) {
            BigDecimal itemSubtotal = itemDto.price().multiply(BigDecimal.valueOf(itemDto.qty()));
            subtotal = subtotal.add(itemSubtotal);

            OrderItemEntity item = new OrderItemEntity();
            // Convert productId string to UUID safely; null if not a valid UUID
            if (itemDto.productId() != null && !itemDto.productId().isBlank()) {
                try {
                    item.setProductId(UUID.fromString(itemDto.productId()));
                } catch (IllegalArgumentException ignored) {
                    item.setProductId(null);
                }
            }
            item.setProductName(itemDto.name());
            item.setUnitPrice(itemDto.price());
            item.setQuantity(itemDto.qty());
            item.setSubtotal(itemSubtotal);
            item.setOrder(order);
            order.getItems().add(item);
        }

        // Delivery fee: 5 for delivery, 0 for pickup
        BigDecimal deliveryFee = "pickup".equalsIgnoreCase(req.deliveryType())
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(5);
        BigDecimal total = subtotal.add(deliveryFee);

        order.setSubtotal(subtotal);
        order.setDeliveryFee(deliveryFee);
        order.setDiscount(BigDecimal.ZERO);
        order.setTotal(total);

        OrderEntity saved = orderRepository.save(order);
        log.info("Order created: id={}, tenant={}, customer={}, deliveryType={}, total={}",
                saved.getId(), saved.getTenantId(), saved.getCustomerName(), saved.getDeliveryType(), saved.getTotal());

        // Send confirmation WhatsApp
        if (saved.getCustomerPhone() != null && !saved.getCustomerPhone().isBlank()) {
            whatsappService.notifyOrderConfirmed(
                    saved.getCustomerPhone(),
                    saved.getCustomerName(),
                    saved.getId().toString().substring(0, 8).toUpperCase()
            );
        }

        return toResponse(saved);
    }

    @Transactional
    public OrderResponse updateStatus(UUID orderId, String newStatus) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        String oldStatus = order.getStatus();
        order.setStatus(newStatus);
        OrderEntity saved = orderRepository.save(order);
        log.info("Order status updated: id={}, {} -> {}", saved.getId(), oldStatus, newStatus);

        // Trigger WhatsApp notification on key status transitions
        notifyOnStatusChange(saved, oldStatus, newStatus);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(UUID orderId) {
        return orderRepository.findById(orderId)
                .map(this::toResponse)
                .orElseThrow(() -> new OrderNotFoundException(orderId));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByTenant(UUID tenantId) {
        return orderRepository.findByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByCustomer(UUID customerId) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ==================== MERCADO PAGO PAYMENT FLOW ====================

    /**
     * Crea una preferencia de pago en Mercado Pago para un pedido existente.
     * Guarda el preferenceId e initPoint en la orden y devuelve la URL de checkout.
     *
     * @param orderId UUID del pedido
     * @return CreatePreferenceResult con preferenceId e initPoint (URL de checkout)
     */
    @Transactional
    public MercadoPagoService.CreatePreferenceResult createPaymentPreference(UUID orderId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        if (order.getTotal() == null || order.getTotal().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El total del pedido debe ser mayor a 0");
        }

        String description = "Pedido " + order.getId().toString().substring(0, 8).toUpperCase()
                + " - Canete Marketplace";

        // Email del payer: usamos un email genérico si no hay (MP lo requiere para algunos métodos)
        String payerEmail = order.getCustomerId() != null
                ? "customer_" + order.getCustomerId().toString().substring(0, 8) + "@canete.marketplace"
                : "guest_" + order.getId().toString().substring(0, 8) + "@canete.marketplace";

        // Métodos de pago permitidos: Yape, Plin y tarjetas
        var paymentMethods = java.util.List.of("yape", "plin", "visa", "master", "amex", "debit_card", "credit_card");

        var result = mercadoPagoService.createPreference(
                order.getId(),
                order.getTenantId(),
                description,
                order.getTotal(),
                order.getCustomerName(),
                payerEmail,
                paymentMethods
        );

        // Guardar preferenceId e initPoint en la orden
        order.setMpPreferenceId(result.preferenceId());
        order.setMpInitPoint(result.initPoint());
        order.setMpPaymentStatus("pending");
        orderRepository.save(order);

        log.info("Preferencia MP asociada a orden {} — preferenceId={}", orderId, result.preferenceId());
        return result;
    }

    /**
     * Procesa una notificación webhook de Mercado Pago.
     * MP envía POST con {type: "payment", data: {id: "12345678901"}}.
     * Consultamos el estado del pago y actualizamos la orden.
     *
     * @param paymentId ID del pago en MP
     * @return OrderResponse actualizada
     */
    @Transactional
    public OrderResponse processPaymentWebhook(Long paymentId) {
        log.info("Procesando webhook MP — paymentId={}", paymentId);

        // Primera consulta: usar credenciales globales para obtener metadata (tenant_id, order_id)
        var paymentInfo = mercadoPagoService.getPaymentInfo(paymentId, null);
        String newOrderStatus = mercadoPagoService.mapMpStatusToOrderStatus(paymentInfo.status());

        // Buscar la orden por metadata.order_id (que enviamos al crear la preferencia)
        OrderEntity order;
        if (paymentInfo.orderId() != null) {
            try {
                UUID orderId = UUID.fromString(paymentInfo.orderId());
                order = orderRepository.findById(orderId)
                        .orElseThrow(() -> new OrderNotFoundException(orderId));
            } catch (IllegalArgumentException e) {
                log.error("Webhook MP con order_id inválido: {}", paymentInfo.orderId());
                throw new IllegalArgumentException("order_id inválido en metadata: " + paymentInfo.orderId());
            }
        } else {
            log.error("Webhook MP sin order_id en metadata — paymentId={}", paymentId);
            throw new IllegalArgumentException("Webhook sin order_id en metadata");
        }

        // Re-consultar con credenciales del tenant si el tenant tiene MP configurado
        // (el dinero va directo a la cuenta del tenant, así que el webhook llega de su cuenta)
        if (paymentInfo.tenantId() != null) {
            try {
                UUID tenantId = UUID.fromString(paymentInfo.tenantId());
                var tenantPaymentInfo = mercadoPagoService.getPaymentInfo(paymentId, tenantId);
                // Usar la info del tenant si es válida
                if (tenantPaymentInfo.status() != null && !"unknown".equals(tenantPaymentInfo.status())) {
                    paymentInfo = tenantPaymentInfo;
                    newOrderStatus = mercadoPagoService.mapMpStatusToOrderStatus(paymentInfo.status());
                }
            } catch (Exception e) {
                log.warn("No se pudo re-consultar pago con credenciales del tenant: {}", e.getMessage());
            }
        }

        String oldStatus = order.getStatus();
        order.setMpPaymentId(paymentId);
        order.setMpPaymentStatus(paymentInfo.status());
        order.setStatus(newOrderStatus);
        OrderEntity saved = orderRepository.save(order);

        log.info("Orden {} actualizada por webhook MP — {} -> {}, paymentStatus={}",
                saved.getId(), oldStatus, newOrderStatus, paymentInfo.status());

        // Notificar al cliente si el pago fue confirmado
        if ("confirmed".equals(newOrderStatus) && !"confirmed".equals(oldStatus)) {
            notifyOnStatusChange(saved, oldStatus, newOrderStatus);
        }

        return toResponse(saved);
    }

    /**
     * SIMULACIÓN de webhook de MP para pruebas E2E sin necesidad de un pago real.
     * <p>
     * Útil cuando no se puede crear un pago real vía API (credenciales APP_USR-
     * bloquean /v1/payments directo). Simula exactamente lo que haría MP:
     * actualiza mp_payment_id, mp_payment_status=approved y status=confirmed.
     *
     * @param orderId   UUID de la orden a confirmar
     * @param paymentId ID de pago simulado (ej. 99999999999)
     * @return OrderResponse actualizada
     */
    @Transactional
    public OrderResponse simulatePaymentWebhook(UUID orderId, Long paymentId) {
        log.info("SIMULANDO webhook MP — orderId={}, paymentId={}", orderId, paymentId);

        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        String oldStatus = order.getStatus();
        order.setMpPaymentId(paymentId);
        order.setMpPaymentStatus("approved");
        order.setStatus("confirmed");
        OrderEntity saved = orderRepository.save(order);

        log.info("Orden {} SIMULADA como confirmada — {} -> confirmed, paymentStatus=approved",
                saved.getId(), oldStatus);

        if (!"confirmed".equals(oldStatus)) {
            notifyOnStatusChange(saved, oldStatus, "confirmed");
        }

        return toResponse(saved);
    }

    // ==================== NOTIFICATION LOGIC ====================

    private void notifyOnStatusChange(OrderEntity order, String oldStatus, String newStatus) {
        if (order.getCustomerPhone() == null || order.getCustomerPhone().isBlank()) {
            log.debug("No customer phone on order {} — skipping WhatsApp", order.getId());
            return;
        }

        String shortId = order.getId().toString().substring(0, 8).toUpperCase();
        String deliveryType = order.getDeliveryType();

        // Delivery: cuando el dueño marca "en camino" → WhatsApp "pedido en camino"
        if ("on_the_way".equalsIgnoreCase(newStatus) && !"on_the_way".equalsIgnoreCase(oldStatus)) {
            whatsappService.notifyOutForDelivery(order.getCustomerPhone(), order.getCustomerName(), shortId);
        }

        // Pickup: cuando el dueño marca "listo para recoger" → WhatsApp "pedido listo para recoger"
        // El dueño avanza manualmente: pending → confirmed → preparing → ready_for_pickup → delivered
        if ("ready_for_pickup".equalsIgnoreCase(newStatus) && !"ready_for_pickup".equalsIgnoreCase(oldStatus)
                && "pickup".equalsIgnoreCase(deliveryType)) {
            whatsappService.notifyReadyForPickup(order.getCustomerPhone(), order.getCustomerName(), shortId);
        }
    }

    // ==================== MAPPER ====================

    private OrderResponse toResponse(OrderEntity e) {
        List<OrderResponse.OrderItemResponse> items = e.getItems().stream()
                .map(i -> new OrderResponse.OrderItemResponse(
                        i.getId(), i.getProductId(), i.getProductName(),
                        i.getUnitPrice(), i.getQuantity(), i.getSubtotal()
                ))
                .collect(Collectors.toList());

        return new OrderResponse(
                e.getId(), e.getTenantId(), e.getCustomerId(),
                e.getCustomerName(), e.getCustomerPhone(), e.getCustomerAddress(),
                e.getStatus(), e.getDeliveryType(), e.getPaymentMethod(),
                e.getPaymentReference(),
                e.getSubtotal(), e.getDeliveryFee(), e.getDiscount(), e.getTotal(),
                e.getNotes(),
                e.getMpPreferenceId(), e.getMpInitPoint(),
                e.getMpPaymentId(), e.getMpPaymentStatus(),
                e.getCreatedAt(), e.getUpdatedAt(), e.getDeliveredAt(),
                items
        );
    }
}

