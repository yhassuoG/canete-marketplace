package com.canete.marketplace.modules.tenant.application;

import java.time.LocalDateTime;

/**
 * Respuesta con la config MP del tenant.
 * El access token NUNCA se incluye por seguridad; solo la public key (mascarada).
 */
public record MpConfigResponse(
        String mpPublicKey,   // mascarada (ej. "APP_USR-...-abcd")
        String mpUserId,
        boolean mpSandbox,
        boolean mpEnabled,
        LocalDateTime mpUpdatedAt
) {}
