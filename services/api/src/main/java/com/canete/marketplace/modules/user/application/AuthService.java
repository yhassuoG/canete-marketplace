package com.canete.marketplace.modules.user.application;

import com.canete.marketplace.modules.user.infrastructure.persistence.UserEntity;
import com.canete.marketplace.modules.user.infrastructure.persistence.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Validates credentials against the users table.
     * Returns the user data if credentials are valid, empty otherwise.
     */
    @Transactional
    public Optional<LoginResponse> login(String email, String rawPassword) {
        try {
            log.info("LOGIN ATTEMPT: email='{}', rawPassword length={}", email, rawPassword.length());
            Optional<UserEntity> userOpt = userRepository.findByEmailIgnoreCase(email.trim());

            if (userOpt.isEmpty()) {
                log.warn("LOGIN FAIL: user not found for email='{}'", email);
                return Optional.empty();
            }

            UserEntity user = userOpt.get();
            log.info("LOGIN: user found email='{}', status='{}', hashPrefix='{}'", user.getEmail(), user.getStatus(), user.getPasswordHash() == null ? "null" : user.getPasswordHash().substring(0, Math.min(20, user.getPasswordHash().length())));

            if (!"active".equals(user.getStatus())) {
                log.warn("LOGIN FAIL: status is '{}', not 'active'", user.getStatus());
                return Optional.empty();
            }

            boolean matches = passwordEncoder.matches(rawPassword, user.getPasswordHash());
            log.info("LOGIN: passwordEncoder.matches result = {}", matches);
            if (!matches) {
                log.warn("LOGIN FAIL: password does not match hash");
                return Optional.empty();
            }

            // Update last_login_at
            user.setLastLoginAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);

            String role = "business_owner".equals(user.getRole()) ? "business" : user.getRole();

            return Optional.of(new LoginResponse(
                    user.getEmail(),
                    user.getFullName(),
                    role,
                    user.getTenantSlug()
            ));

        } catch (Exception e) {
            log.error("Auth DB error: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
