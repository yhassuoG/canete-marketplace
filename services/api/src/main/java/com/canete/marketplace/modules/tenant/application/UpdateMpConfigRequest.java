package com.canete.marketplace.modules.tenant.application;

/**
 * Request para guardar las credenciales de Mercado Pago de un tenant.
 * El access token se guarda cifrado en la BD y nunca se devuelve en respuestas.
 */
public record UpdateMpConfigRequest(
        String mpAccessToken,
        String mpPublicKey,
        String mpUserId,
        Boolean mpSandbox,
        Boolean mpEnabled
) {}
