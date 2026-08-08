package com.canete.marketplace.modules.order.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.TenantConfigEntity;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.TenantConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Servicio que integra con la API REST de Mercado Pago.
 * <p>
 * Usa RestClient de Spring 6.1+ (sin SDK externo) para:
 * 1. Crear una preferencia de pago → devuelve URL de checkout (init_point).
 * 2. Consultar el estado de un pago por payment_id.
 * <p>
 * En modo Sandbox, Mercado Pago simula el pago sin cobrar dinero real.
 * El cliente será redirigido a una página de MP donde elige Yape/Plin/tarjeta.
 */
@Service
public class MercadoPagoService {

    private static final Logger log = LoggerFactory.getLogger(MercadoPagoService.class);

    private final RestClient globalRestClient;   // fallback con credenciales globales
    private final ObjectMapper objectMapper;
    private final TenantConfigRepository tenantConfigRepository;
    private final String globalPublicKey;
    private final String globalAccessToken;
    private final boolean sandbox;
    private final String frontendUrl;
    private final String apiBaseUrl;

    public MercadoPagoService(
            @Value("${app.mercadopago.access-token:}") String accessToken,
            @Value("${app.mercadopago.public-key:}") String publicKey,
            @Value("${app.mercadopago.sandbox:true}") boolean sandbox,
            @Value("${app.mercadopago.api-base-url:https://api.mercadopago.com}") String apiBaseUrl,
            @Value("${app.mercadopago.frontend-url:http://localhost:3002}") String frontendUrl,
            TenantConfigRepository tenantConfigRepository,
            ObjectMapper objectMapper
    ) {
        this.globalPublicKey = publicKey;
        this.globalAccessToken = accessToken;
        this.sandbox = sandbox;
        this.frontendUrl = frontendUrl;
        this.apiBaseUrl = apiBaseUrl;
        this.objectMapper = objectMapper;
        this.tenantConfigRepository = tenantConfigRepository;
        this.globalRestClient = RestClient.builder()
                .baseUrl(apiBaseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
        log.info("MercadoPagoService inicializado (multi-tenant) — sandbox={}, apiBaseUrl={}", sandbox, apiBaseUrl);
    }

    /**
     * Resuelve las credenciales de MP para un tenant.
     * Si el tenant tiene MP configurado y habilitado, usa sus credenciales.
     * Si no, usa las credenciales globales (fallback para backwards-compat).
     */
    private MpCredentials resolveCredentials(UUID tenantId) {
        if (tenantId != null) {
            try {
                TenantConfigEntity cfg = tenantConfigRepository.findByTenantId(tenantId).orElse(null);
                if (cfg != null && Boolean.TRUE.equals(cfg.getMpEnabled())
                        && cfg.getMpAccessToken() != null && !cfg.getMpAccessToken().isBlank()) {
                    boolean tenantSandbox = cfg.getMpSandbox() != null ? cfg.getMpSandbox() : true;
                    return new MpCredentials(
                            cfg.getMpAccessToken(),
                            cfg.getMpPublicKey(),
                            tenantSandbox,
                            true   // tenant credentials
                    );
                }
            } catch (Exception e) {
                log.warn("Error cargando credenciales MP del tenant {}: {}", tenantId, e.getMessage());
            }
        }
        return new MpCredentials(globalAccessToken, globalPublicKey, sandbox, false);
    }

    /** Construye un RestClient con un access token específico. */
    private RestClient clientFor(String accessToken) {
        return RestClient.builder()
                .baseUrl(apiBaseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /**
     * Crea una preferencia de pago en Mercado Pago.
     * <p>
     * MP devuelve un JSON con:
     * - id: ID de la preferencia (guardar en order.mp_preference_id)
     * - init_point: URL de checkout Sandbox (usar cuando sandbox=true)
     * - init_point_production: URL de checkout Producción (usar cuando sandbox=false)
     *
     * @param orderId        UUID del pedido (para metadata y URLs de retorno)
     * @param tenantId       UUID del tenant (para metadata)
     * @param description    Descripción del pago (ej. "Pedido #123 - Canete Marketplace")
     * @param amount         Monto total a cobrar
     * @param payerName      Nombre del cliente
     * @param payerEmail     Email del cliente (opcional, MP lo requiere para algunos métodos)
     * @param paymentMethods Métodos de pago permitidos (ej. ["yape", "plin", "card"])
     * @return CreatePreferenceResult con preferenceId e initPoint (URL de checkout)
     */
    public CreatePreferenceResult createPreference(
            UUID orderId,
            UUID tenantId,
            String description,
            BigDecimal amount,
            String payerName,
            String payerEmail,
            java.util.List<String> paymentMethods
    ) {
        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("description", description);

            // Items (MP requiere al menos un item)
            ArrayNode items = body.putArray("items");
            ObjectNode item = items.addObject();
            item.put("id", orderId.toString());
            item.put("title", description);
            item.put("quantity", 1);
            item.put("unit_price", amount.doubleValue());
            item.put("currency_id", "PEN"); // Soles peruanos

            // Payer (datos del cliente)
            ObjectNode payer = body.putObject("payer");
            payer.put("name", payerName != null ? payerName : "Cliente");
            if (payerEmail != null && !payerEmail.isBlank()) {
                payer.put("email", payerEmail);
            }

            // URLs de retorno (MP redirige aquí después del pago)
            // MP rechaza URLs localhost para credenciales de producción (APP_USR-).
            // Si frontendUrl es localhost, usamos placeholders que MP acepta.
            String effectiveFrontendUrl = frontendUrl;
            boolean isLocalUrl = frontendUrl != null && (frontendUrl.contains("localhost") || frontendUrl.contains("127.0.0.1"));
            if (isLocalUrl) {
                effectiveFrontendUrl = "https://www.mercadopago.com"; // placeholder válido para dev
            }
            String backUrl = effectiveFrontendUrl + "/payment/callback?order_id=" + orderId;
            ObjectNode backUrls = body.putObject("back_urls");
            backUrls.put("success", backUrl + "&status=success");
            backUrls.put("failure", backUrl + "&status=failure");
            backUrls.put("pending", backUrl + "&status=pending");
            // auto_return=approved requiere back_urls.success válido y URL pública
            if (!isLocalUrl) {
                body.put("auto_return", "approved");
            }

            // Webhook notification URL (MP POSTea aquí cuando el pago cambia de estado)
            // Se configura en el panel de MP, no en la preferencia.

            // Metadata (para identificar el pedido en el webhook)
            ObjectNode metadata = body.putObject("metadata");
            metadata.put("order_id", orderId.toString());
            metadata.put("tenant_id", tenantId.toString());

            // Statement descriptor (texto que aparece en el estado de cuenta del cliente)
            body.put("statement_descriptor", "CANETE-MKT");

            log.info("Creando preferencia MP para orden {} — monto={} PEN, tenant={}", orderId, amount, tenantId);

            MpCredentials creds = resolveCredentials(tenantId);
            RestClient client = creds.tenant() ? clientFor(creds.accessToken()) : globalRestClient;

            JsonNode response = client.post()
                    .uri("/checkout/preferences")
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            if (response == null) {
                throw new RuntimeException("Respuesta vacía de Mercado Pago");
            }

            String preferenceId = response.path("id").asText();
            // En Sandbox usar init_point, en Producción usar init_point_production
            String initPoint;
            if (creds.sandbox()) {
                initPoint = response.path("init_point").asText(null);
            } else {
                initPoint = response.path("init_point_production").asText(null);
                if (initPoint == null) {
                    initPoint = response.path("init_point").asText(null);
                }
            }

            if (preferenceId == null || initPoint == null) {
                log.error("Respuesta MP sin preferenceId o initPoint: {}", response);
                throw new RuntimeException("Respuesta inválida de Mercado Pago: " + response);
            }

            log.info("Preferencia MP creada — id={}, initPoint={}", preferenceId, initPoint);
            return new CreatePreferenceResult(preferenceId, initPoint);

        } catch (Exception e) {
            log.error("Error creando preferencia MP para orden {}: {}", orderId, e.getMessage(), e);
            throw new RuntimeException("Error al crear preferencia de pago: " + e.getMessage(), e);
        }
    }

    /**
     * Consulta el estado de un pago en Mercado Pago por su payment_id.
     * <p>
     * Estados posibles: pending, approved, authorized, in_process, in_mediation,
     * rejected, cancelled, refunded, charged_back.
     *
     * @param paymentId ID del pago en MP
     * @param tenantId  UUID del tenant (para resolver credenciales); null usa globales
     * @return PaymentInfo con status y detalles
     */
    public PaymentInfo getPaymentInfo(Long paymentId, UUID tenantId) {
        try {
            log.info("Consultando pago MP {} (tenant={})", paymentId, tenantId);

            MpCredentials creds = resolveCredentials(tenantId);
            RestClient client = creds.tenant() ? clientFor(creds.accessToken()) : globalRestClient;

            JsonNode response = client.get()
                    .uri("/v1/payments/{id}", paymentId)
                    .retrieve()
                    .body(JsonNode.class);

            if (response == null) {
                throw new RuntimeException("Respuesta vacía de Mercado Pago");
            }

            String status = response.path("status").asText("unknown");
            String statusDetail = response.path("status_detail").asText(null);
            BigDecimal transactionAmount = response.path("transaction_amount").decimalValue();
            String paymentMethodId = response.path("payment_method_id").asText(null);
            String paymentTypeId = response.path("payment_type_id").asText(null);

            // Metadata que enviamos al crear la preferencia
            JsonNode metadata = response.path("metadata");
            String orderId = metadata.path("order_id").asText(null);
            String tenantIdFromMeta = metadata.path("tenant_id").asText(null);

            log.info("Pago MP {} — status={}, method={}, amount={}",
                    paymentId, status, paymentMethodId, transactionAmount);

            return new PaymentInfo(
                    paymentId,
                    status,
                    statusDetail,
                    transactionAmount,
                    paymentMethodId,
                    paymentTypeId,
                    orderId,
                    tenantIdFromMeta
            );

        } catch (Exception e) {
            log.error("Error consultando pago MP {}: {}", paymentId, e.getMessage(), e);
            throw new RuntimeException("Error al consultar pago: " + e.getMessage(), e);
        }
    }

    /**
     * Mapea el estado de MP al estado interno del pedido.
     * <p>
     * MP status → Order status:
     * - approved → "confirmed" (pago confirmado, preparar pedido)
     * - pending / in_process / in_mediation → "pending_payment"
     * - rejected / cancelled / charged_back → "payment_rejected"
     * - refunded → "refunded"
     * - authorized → "confirmed" (autorizado pero no capturado)
     */
    public String mapMpStatusToOrderStatus(String mpStatus) {
        if (mpStatus == null) return "pending_payment";
        return switch (mpStatus) {
            case "approved", "authorized" -> "confirmed";
            case "pending", "in_process", "in_mediation" -> "pending_payment";
            case "rejected", "cancelled", "charged_back" -> "payment_rejected";
            case "refunded" -> "refunded";
            default -> "pending_payment";
        };
    }

    public boolean isSandbox() {
        return sandbox;
    }

    public boolean isSandbox(UUID tenantId) {
        MpCredentials creds = resolveCredentials(tenantId);
        return creds.sandbox();
    }

    public String getPublicKey() {
        return globalPublicKey;
    }

    public String getPublicKey(UUID tenantId) {
        MpCredentials creds = resolveCredentials(tenantId);
        return creds.publicKey() != null ? creds.publicKey() : globalPublicKey;
    }

    // ── DTOs de respuesta ──────────────────────────────────────────────────

    private record MpCredentials(
            String accessToken,
            String publicKey,
            boolean sandbox,
            boolean tenant   // true si usa credenciales del tenant, false si globales
    ) {}

    public record CreatePreferenceResult(
            String preferenceId,
            String initPoint  // URL a la que redirigir al cliente
    ) {}

    public record PaymentInfo(
            Long paymentId,
            String status,
            String statusDetail,
            BigDecimal transactionAmount,
            String paymentMethodId,   // ej. "yape", "plin", "visa"
            String paymentTypeId,     // ej. "debit_card", "credit_card", "wallet_payment"
            String orderId,           // de metadata
            String tenantId           // de metadata
    ) {}
}
