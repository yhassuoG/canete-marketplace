package com.canete.marketplace.modules.customer.application;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

/**
 * Verifies a Google ID token by calling Google's tokeninfo endpoint.
 * No extra OAuth2 dependency needed.
 */
@Service
public class GoogleTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(GoogleTokenVerifier.class);
    private static final String TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Returns the token claims if valid, empty if invalid or expired.
     * Claims include: sub, email, name, picture, email_verified
     */
    @SuppressWarnings("unchecked")
    public Optional<GoogleClaims> verify(String idToken) {
        try {
            Map<String, Object> response = restTemplate.getForObject(
                    TOKENINFO_URL + idToken, Map.class);

            if (response == null || response.containsKey("error")) {
                return Optional.empty();
            }

            String emailVerified = (String) response.get("email_verified");
            if (!"true".equals(emailVerified)) {
                return Optional.empty();
            }

            return Optional.of(new GoogleClaims(
                    (String) response.get("sub"),
                    (String) response.get("email"),
                    (String) response.get("name"),
                    (String) response.get("picture")
            ));
        } catch (Exception e) {
            log.warn("Google token verification failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public record GoogleClaims(String sub, String email, String name, String picture) {}
}
