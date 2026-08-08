package com.canete.marketplace.modules.order.application;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

import jakarta.annotation.PostConstruct;

/**
 * Servicio para enviar notificaciones WhatsApp a los clientes sobre el estado de sus pedidos.
 *
 * Usa Twilio WhatsApp Business API. Requiere configurar:
 *   - app.whatsapp.account-sid
 *   - app.whatsapp.auth-token
 *   - app.whatsapp.from-number  (ej: whatsapp:+14155238886)
 */
@Service
public class WhatsAppNotificationService {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppNotificationService.class);

    @Value("${app.whatsapp.enabled:true}")
    private boolean enabled;

    @Value("${app.whatsapp.account-sid:}")
    private String accountSid;

    @Value("${app.whatsapp.auth-token:}")
    private String authToken;

    @Value("${app.whatsapp.from-number:whatsapp:+14155238886}")
    private String fromNumber;

    @PostConstruct
    public void init() {
        if (enabled && accountSid != null && !accountSid.isBlank()
                && !accountSid.startsWith("ACxxxx")) {
            Twilio.init(accountSid, authToken);
            log.info("WhatsApp notifications ENABLED — Twilio SID: {}…{}", accountSid.substring(0, 4), accountSid.substring(accountSid.length() - 4));
        } else {
            log.warn("WhatsApp notifications DISABLED — credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM env vars.");
        }
    }

    private boolean isConfigured() {
        return enabled
                && accountSid != null && !accountSid.isBlank() && !accountSid.startsWith("ACxxxx")
                && authToken != null && !authToken.isBlank();
    }

    /**
     * Notifica al cliente que su pedido está listo para recoger (pickup).
     */
    public void notifyReadyForPickup(String customerPhone, String customerName, String orderId) {
        String msg = "¡Hola " + (customerName != null ? customerName : "") + "! 🍽️\n\n"
                + "Tu pedido #" + orderId + " ya está LISTO PARA RECOGER.\n\n"
                + "Pásate por nuestro local para recogerlo. ¡Gracias por tu compra! 😊";
        sendWhatsApp(customerPhone, msg);
    }

    /**
     * Notifica al cliente que su pedido está en camino (delivery).
     */
    public void notifyOutForDelivery(String customerPhone, String customerName, String orderId) {
        String msg = "¡Hola " + (customerName != null ? customerName : "") + "! 🛵\n\n"
                + "Tu pedido #" + orderId + " ya está EN CAMINO hacia tu dirección.\n\n"
                + "¡Llegará pronto! Gracias por tu compra. 😊";
        sendWhatsApp(customerPhone, msg);
    }

    /**
     * Notifica al cliente que su pedido ha sido confirmado.
     */
    public void notifyOrderConfirmed(String customerPhone, String customerName, String orderId) {
        String msg = "¡Hola " + (customerName != null ? customerName : "") + "! ✅\n\n"
                + "Hemos recibido tu pedido #" + orderId + " y está siendo preparado.\n\n"
                + "Te avisaremos cuando esté listo. 😊";
        sendWhatsApp(customerPhone, msg);
    }

    /**
     * Envía un mensaje WhatsApp al número indicado.
     * El número debe estar en formato E.164 (ej: +51987654321).
     */
    private void sendWhatsApp(String toPhone, String body) {
        if (toPhone == null || toPhone.isBlank()) {
            log.warn("Cannot send WhatsApp: customer phone is null/blank");
            return;
        }
        if (!isConfigured()) {
            log.info("[WHATSAPP DISABLED] To: {} | Body: {}", toPhone, body);
            return;
        }

        try {
            String to = toPhone.startsWith("whatsapp:") ? toPhone : "whatsapp:" + normalizePhone(toPhone);
            Message.creator(
                    new PhoneNumber(to),
                    new PhoneNumber(fromNumber),
                    body
            ).create();
            log.info("WhatsApp sent to {} for order", toPhone);
        } catch (Exception e) {
            log.error("Failed to send WhatsApp to {}: {}", toPhone, e.getMessage());
        }
    }

    /**
     * Normaliza el teléfono a formato E.164.
     * Si no empieza con +, asume Perú (+51) como default.
     */
    private String normalizePhone(String phone) {
        String cleaned = phone.replaceAll("[\\s\\-\\(\\)]", "");
        if (cleaned.startsWith("+")) {
            return cleaned;
        }
        if (cleaned.startsWith("51")) {
            return "+" + cleaned;
        }
        if (cleaned.startsWith("9") && cleaned.length() == 9) {
            return "+51" + cleaned;
        }
        return "+" + cleaned;
    }
}
