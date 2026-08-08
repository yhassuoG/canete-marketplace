package com.canete.marketplace.modules.customer.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface MarketplaceAccountRepository extends JpaRepository<MarketplaceAccountEntity, UUID> {
    Optional<MarketplaceAccountEntity> findByGoogleSub(String googleSub);
    Optional<MarketplaceAccountEntity> findByEmail(String email);
}
