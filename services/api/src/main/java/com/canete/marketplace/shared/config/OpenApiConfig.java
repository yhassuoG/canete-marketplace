package com.canete.marketplace.shared.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI marketplaceOpenApi() {
        return new OpenAPI()
            .info(new Info()
                .title("Canete Marketplace API")
                .description("Base API for tourism, reservations, delivery and multi-tenant business operations")
                .version("v1")
                .contact(new Contact().name("Platform Team").email("platform@example.com")))
            .addSecurityItem(new SecurityRequirement().addList("bearer-jwt"))
            .schemaRequirement("bearer-jwt", new SecurityScheme()
                .name("bearer-jwt")
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT"));
    }
}
