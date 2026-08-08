package com.canete.marketplace.modules.order.infrastructure.web;

import com.canete.marketplace.modules.order.application.MercadoPagoService;
import com.canete.marketplace.modules.order.application.OrderNotFoundException;
import com.canete.marketplace.modules.order.application.OrderResponse;
import com.canete.marketplace.modules.order.application.OrderService;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Controller para integración con Mercado Pago.
 * <p>
 * Endpoints:
 * 1. POST /api/v1/payments/create-preference/{orderId}
 *    Crea una preferencia de pago en MP y devuelve la URL de checkout.
 *    El frontend redirige al cliente a esa URL.
 * <p>
 * 2. POST /api/v1/payments/webhook
 *    Recibe notificaciones de MP cuando el pago cambia de estado.
 *    MP envía {type: "payment", data: {id: "12345678901"}}.
 *    Este endpoint debe ser público (lo llama MP desde sus servidores).
 * <p>
 * 3. GET /api/v1/payments/status/{orderId}
 *    Consulta el estado de pago de un pedido (para polling desde el frontend).
 */
@RestController
@RequestMapping("/api/v1/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final OrderService orderService;
    private final MercadoPagoService mercadoPagoService;

    public PaymentController(OrderService orderService, MercadoPagoService mercadoPagoService) {
        this.orderService = orderService;
        this.mercadoPagoService = mercadoPagoService;
    }

    /**
     * Crea una preferencia de pago en Mercado Pago para un pedido existente.
     * <p>
     * Flujo:
     * 1. El frontend crea el pedido (POST /api/v1/orders) → obtiene orderId
     * 2. El frontend llama este endpoint → obtiene initPoint (URL de checkout)
     * 3. El frontend redirige al cliente a initPoint
     * 4. MP procesa el pago (Yape/Plin/tarjeta) y redirige de vuelta
     * 5. MP notifica al backend via webhook → actualiza el estado del pedido
     *
     * @param orderId UUID del pedido
     * @return {preferenceId, initPoint} — initPoint es la URL a la que redirigir
     */
    @PostMapping("/create-preference/{orderId}")
    public ResponseEntity<?> createPreference(@PathVariable UUID orderId) {
        try {
            var result = orderService.createPaymentPreference(orderId);
            return ResponseEntity.ok(Map.of(
                    "preferenceId", result.preferenceId(),
                    "initPoint", result.initPoint(),
                    "sandbox", mercadoPagoService.isSandbox()
            ));
        } catch (OrderNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error creando preferencia para orden {}: {}", orderId, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error al crear preferencia de pago"));
        }
    }

    /**
     * Webhook de Mercado Pago.
     * <p>
     * MP envía notificaciones cuando el estado de un pago cambia.
     * Formato del body:
     * <pre>
     * {
     *   "type": "payment",
     *   "data": {
     *     "id": "12345678901"
     *   }
     * }
     * </pre>
     * <p>
     * También puede venir como query params (IPN): ?type=payment&data.id=12345678901
     * <p>
     * Este endpoint debe responder 200 OK rápido (MP reintenta si no).
     *
     * @param body   Body JSON de la notificación
     * @param type   Query param type (alternativa a body)
     * @param dataId Query param data.id (alternativa a body)
     */
    @PostMapping("/webhook")
    public ResponseEntity<?> webhook(
            @RequestBody(required = false) JsonNode body,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "data.id", required = false) String dataId
    ) {
        try {
            log.info("Webhook MP recibido — body={}", body);

            String eventType;
            String paymentIdStr;

            // Priorizar body JSON, fallback a query params (IPN)
            if (body != null && !body.isNull()) {
                eventType = body.path("type").asText(null);
                JsonNode dataNode = body.path("data");
                paymentIdStr = dataNode.path("id").asText(null);
            } else {
                eventType = type;
                paymentIdStr = dataId;
            }

            if (eventType == null || paymentIdStr == null) {
                log.warn("Webhook MP sin type o data.id — ignorando");
                return ResponseEntity.ok(Map.of("status", "ignored"));
            }

            // Solo procesamos notificaciones de tipo "payment"
            if (!"payment".equals(eventType)) {
                log.info("Webhook MP tipo {} (no es payment) — ignorando", eventType);
                return ResponseEntity.ok(Map.of("status", "ignored", "type", eventType));
            }

            Long paymentId;
            try {
                paymentId = Long.parseLong(paymentIdStr);
            } catch (NumberFormatException e) {
                log.error("Webhook MP con paymentId inválido: {}", paymentIdStr);
                return ResponseEntity.badRequest().body(Map.of("error", "paymentId inválido"));
            }

            // Procesar el pago (consultar MP API y actualizar orden)
            OrderResponse updated = orderService.processPaymentWebhook(paymentId);

            log.info("Webhook MP procesado — paymentId={}, orderStatus={}",
                    paymentId, updated.status());

            return ResponseEntity.ok(Map.of(
                    "status", "processed",
                    "orderId", updated.id(),
                    "orderStatus", updated.status()
            ));

        } catch (Exception e) {
            log.error("Error procesando webhook MP: {}", e.getMessage(), e);
            // MP reintenta si respondemos non-200, pero para errores de negocio
            // respondemos 200 para evitar reintentos infinitos
            return ResponseEntity.ok(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    /**
     * Consulta el estado de pago de un pedido.
     * El frontend puede hacer polling aquí después de redirigir de vuelta de MP.
     *
     * @param orderId UUID del pedido
     * @return {status, mpPaymentStatus, mpPaymentId} o 404 si no existe
     */
    @GetMapping("/status/{orderId}")
    public ResponseEntity<?> getPaymentStatus(@PathVariable UUID orderId) {
        try {
            OrderResponse order = orderService.getOrder(orderId);
            return ResponseEntity.ok(Map.of(
                    "orderId", order.id(),
                    "status", order.status(),
                    "mpPaymentStatus", order.mpPaymentStatus() != null ? order.mpPaymentStatus() : "none",
                    "mpPaymentId", order.mpPaymentId() != null ? order.mpPaymentId() : 0,
                    "mpPreferenceId", order.mpPreferenceId() != null ? order.mpPreferenceId() : ""
            ));
        } catch (OrderNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Endpoint de TEST para simular un webhook de MP sin necesidad de pago real.
     * <p>
     * Uso: POST /api/v1/payments/test-webhook/{orderId}
     * Simula que MP confirma el pago: actualiza mp_payment_id, mp_payment_status=approved,
     * status=confirmed. Útil para probar el flujo E2E (webhook → BD → polling → frontend)
     * cuando no se puede crear un pago real (credenciales APP_USR- bloquean /v1/payments).
     * <p>
     * NO usar en producción.
     */
    @PostMapping("/test-webhook/{orderId}")
    public ResponseEntity<?> testWebhook(@PathVariable UUID orderId) {
        try {
            Long simulatedPaymentId = 99999999999L;
            OrderResponse updated = orderService.simulatePaymentWebhook(orderId, simulatedPaymentId);
            log.info("TEST webhook procesado — orderId={}, orderStatus={}", orderId, updated.status());
            return ResponseEntity.ok(Map.of(
                    "status", "processed",
                    "simulated", true,
                    "orderId", updated.id(),
                    "orderStatus", updated.status(),
                    "mpPaymentStatus", updated.mpPaymentStatus(),
                    "mpPaymentId", updated.mpPaymentId()
            ));
        } catch (OrderNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error en test webhook: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    /**
     * Endpoint de salud para verificar que la integración MP está activa.
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "sandbox", mercadoPagoService.isSandbox(),
                "publicKey", mercadoPagoService.getPublicKey() != null
                        ? mercadoPagoService.getPublicKey().substring(0, Math.min(10, mercadoPagoService.getPublicKey().length())) + "..."
                        : "not-configured"
        ));
    }
}
