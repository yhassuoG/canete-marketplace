package com.canete.marketplace.shared.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security")
public record JwtProperties(String jwtSecret) {
}
