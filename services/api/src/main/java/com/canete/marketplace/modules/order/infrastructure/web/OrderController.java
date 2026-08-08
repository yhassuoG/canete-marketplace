package com.canete.marketplace.modules.order.infrastructure.web;

import com.canete.marketplace.modules.order.application.CreateOrderRequest;
import com.canete.marketplace.modules.order.application.OrderNotFoundException;
import com.canete.marketplace.modules.order.application.OrderResponse;
import com.canete.marketplace.modules.order.application.OrderService;
import com.canete.marketplace.modules.order.application.UpdateOrderStatusRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/v1/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * Crea un nuevo pedido.
     * Body: CreateOrderRequest con items, customer info, deliveryType.
     * Dispara notificación WhatsApp de confirmación al cliente.
     */
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        OrderResponse created = orderService.createOrder(request);
        return ResponseEntity.ok(created);
    }

    /**
     * Obtiene un pedido por ID.
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable UUID orderId) {
        try {
            return ResponseEntity.ok(orderService.getOrder(orderId));
        } catch (OrderNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Lista pedidos de un tenant.
     */
    @GetMapping
    public ResponseEntity<List<OrderResponse>> listOrders(@RequestParam UUID tenantId) {
        return ResponseEntity.ok(orderService.getOrdersByTenant(tenantId));
    }

    /**
     * Lista todos los pedidos de la plataforma (para admin).
     */
    @GetMapping("/all")
    public ResponseEntity<List<OrderResponse>> listAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    /**
     * Lista pedidos de un cliente.
     */
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<OrderResponse>> listOrdersByCustomer(@PathVariable UUID customerId) {
        return ResponseEntity.ok(orderService.getOrdersByCustomer(customerId));
    }

    /**
     * Actualiza el estado de un pedido.
     * Dispara notificación WhatsApp según transición:
     *   - → "on_the_way": "pedido en camino" (delivery)
     *   - → "confirmed" + pickup: "pedido listo para recoger"
     */
    @PatchMapping("/{orderId}/status")
    public ResponseEntity<OrderResponse> updateStatus(
            @PathVariable UUID orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        try {
            OrderResponse updated = orderService.updateStatus(orderId, request.status());
            return ResponseEntity.ok(updated);
        } catch (OrderNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
