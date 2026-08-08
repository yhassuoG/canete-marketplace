package com.canete.marketplace.modules.user.application;

import com.canete.marketplace.modules.user.infrastructure.persistence.UserEntity;
import com.canete.marketplace.modules.user.infrastructure.persistence.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Ensures demo users in the DB have correct BCrypt-hashed passwords.
 * Runs once at startup. Safe to run multiple times (idempotent).
 */
@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    // email → raw password for demo users
    private static final Map<String, String> DEMO_PASSWORDS = Map.of(
            "admin@canete.app",  "admin123",
            "muelle@demo.com",   "demo123",
            "paraiso@demo.com",  "demo123",
            "vina@demo.com",     "demo123",
            "hotel@demo.com",    "demo123",
            "alitas@demo.com",   "demo123",
            "zelita@demo.com",   "demo123"
    );

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        try {
            int updated = 0;
            for (var entry : DEMO_PASSWORDS.entrySet()) {
                var user = userRepository.findByEmailIgnoreCase(entry.getKey())
                        .orElseGet(() -> createDemoUser(entry.getKey()));
                // Re-hash only if current hash is the SQL placeholder or not a valid BCrypt hash
                String currentHash = user.getPasswordHash();
                boolean needsRehash = currentHash == null
                        || !currentHash.startsWith("$2")
                        || !passwordEncoder.matches(entry.getValue(), currentHash);

                if (needsRehash) {
                    user.setPasswordHash(passwordEncoder.encode(entry.getValue()));
                    userRepository.save(user);
                    updated++;
                    log.info("Password hashed for user: {}", entry.getKey());
                }
            }
            if (updated > 0) {
                log.info("DataInitializer: updated {} user password(s)", updated);
            }
        } catch (Exception e) {
            log.warn("DataInitializer skipped (DB may not be ready): {}", e.getMessage());
        }
    }

    private UserEntity createDemoUser(String email) {
        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setStatus("active");

        if ("admin@canete.app".equals(email)) {
            user.setFullName("Administrador Cañete");
            user.setRole("admin");
            log.info("DataInitializer: creating missing demo admin user");
        } else {
            user.setFullName("Demo User");
            user.setRole("customer");
            log.info("DataInitializer: creating missing demo user without tenant mapping: {}", email);
        }

        return userRepository.save(user);
    }
}
