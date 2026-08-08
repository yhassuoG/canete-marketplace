package com.canete.marketplace.modules.tenant.application;

import com.canete.marketplace.modules.tenant.domain.Tenant;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.PlanEntity;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.PlanRepository;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.TenantConfigEntity;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.TenantConfigRepository;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.TenantEntity;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.TenantRepository;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.TenantSubscriptionEntity;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.TenantSubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class TenantService {

    private static final Logger log = LoggerFactory.getLogger(TenantService.class);

    private final TenantRepository tenantRepository;
    private final TenantConfigRepository configRepository;
    private final PlanRepository planRepository;
    private final TenantSubscriptionRepository subscriptionRepository;

    public TenantService(TenantRepository tenantRepository,
                         TenantConfigRepository configRepository,
                         PlanRepository planRepository,
                         TenantSubscriptionRepository subscriptionRepository) {
        this.tenantRepository = tenantRepository;
        this.configRepository = configRepository;
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    public List<Tenant> findAll() {
        return tenantRepository.findByStatus("active").stream()
                .map(this::toTenant)
                .toList();
    }

    public Optional<Tenant> findBySlug(String slug) {
        return tenantRepository.findBySlug(slug).map(this::toTenant);
    }

    // ── Mutations ─────────────────────────────────────────────────────────────

    @Transactional
    public Tenant createTenant(CreateTenantRequest req) {
        String resolvedSlug = normalizeSlug(req.slug(), req.name());
        if (tenantRepository.existsBySlug(resolvedSlug)) {
            throw new TenantSlugAlreadyExistsException(resolvedSlug);
        }

        LocalDateTime now = LocalDateTime.now();
        TenantEntity tenant = new TenantEntity();
        tenant.setSlug(resolvedSlug);
        tenant.setName(req.name().trim());
        tenant.setCategory(req.category().trim().toLowerCase(Locale.ROOT));
        tenant.setLocation(req.location().trim());
        tenant.setTagline(trimToNull(req.tagline()));
        tenant.setDescription(trimToNull(req.description()));
        tenant.setPhone(trimToNull(req.phone()));
        tenant.setPrimaryColor(defaultColor(req.primaryColor()));
        tenant.setGradient(buildGradient(tenant.getPrimaryColor()));
        tenant.setStatus("active");
        tenant.setRating(BigDecimal.ZERO);
        tenant.setReviewCount(0);
        tenant.setMonthlyRevenue(BigDecimal.ZERO);
        tenant.setReservationsThisMonth(0);
        tenant.setOrdersThisMonth(0);
        tenant.setCreatedAt(now);
        tenant.setUpdatedAt(now);

        TenantEntity savedTenant;
        try {
            savedTenant = tenantRepository.save(tenant);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("The business data is not valid for persistence", ex);
        }

        if (hasConfigPayload(req)) {
            TenantConfigEntity config = new TenantConfigEntity();
            config.setTenantId(savedTenant.getId());
            config.setAddress(trimToNull(req.address()));
            config.setLat(parseDecimal(req.lat()));
            config.setLng(parseDecimal(req.lng()));
            config.setUpdatedAt(now);
            configRepository.save(config);
        }

        return toTenant(savedTenant);
    }

    @Transactional
    public Tenant updateConfig(String slug, UpdateTenantConfigRequest req) {
        TenantEntity tenant = tenantRepository.findBySlug(slug)
                .orElseThrow(() -> new TenantNotFoundException(slug));

        if (req.name()         != null && !req.name().isBlank())         tenant.setName(req.name().trim());
        if (req.tagline()      != null && !req.tagline().isBlank())      tenant.setTagline(req.tagline().trim());
        if (req.description()  != null && !req.description().isBlank())  tenant.setDescription(req.description().trim());
        if (req.phone()        != null && !req.phone().isBlank())        tenant.setPhone(req.phone().trim());
        if (req.primaryColor() != null && !req.primaryColor().isBlank()) tenant.setPrimaryColor(req.primaryColor().trim());
        tenant.setUpdatedAt(LocalDateTime.now());
        tenantRepository.save(tenant);

        // Upsert tenant_config (lat / lng / address)
        TenantConfigEntity config = configRepository.findByTenantId(tenant.getId())
                .orElseGet(() -> {
                    TenantConfigEntity c = new TenantConfigEntity();
                    c.setTenantId(tenant.getId());
                    return c;
                });

        if (req.address() != null) config.setAddress(req.address().trim());
        if (req.lat() != null && !req.lat().isBlank()) {
            try { config.setLat(new BigDecimal(req.lat())); } catch (NumberFormatException ignored) {}
        }
        if (req.lng() != null && !req.lng().isBlank()) {
            try { config.setLng(new BigDecimal(req.lng())); } catch (NumberFormatException ignored) {}
        }
        if (req.allowsDelivery() != null) config.setAllowsDelivery(req.allowsDelivery());
        if (req.allowsPickup()   != null) config.setAllowsPickup(req.allowsPickup());
        if (req.deliveryFee() != null && !req.deliveryFee().isBlank()) {
            try { config.setDeliveryFee(new BigDecimal(req.deliveryFee())); } catch (NumberFormatException ignored) {}
        }
        if (req.yapePhone() != null) config.setYapePhone(req.yapePhone().trim());
        if (req.yapeQrUrl()  != null) config.setYapeQrUrl(req.yapeQrUrl().trim());
        if (req.bannerUrl() != null) config.setBannerUrl(req.bannerUrl().trim());
        if (req.logoUrl()   != null) config.setLogoUrl(req.logoUrl().trim());
        config.setUpdatedAt(LocalDateTime.now());
        configRepository.save(config);

        return toTenant(tenant);
    }

    // ── Mercado Pago config (multi-tenant) ───────────────────────────────────

    /**
     * Guarda las credenciales de Mercado Pago del tenant.
     * El tenant configura su propia cuenta MP → el dinero va directo a su cuenta.
     */
    @Transactional
    public MpConfigResponse updateMpConfig(String slug, UpdateMpConfigRequest req) {
        TenantEntity tenant = tenantRepository.findBySlug(slug)
                .orElseThrow(() -> new TenantNotFoundException(slug));

        TenantConfigEntity config = configRepository.findByTenantId(tenant.getId())
                .orElseGet(() -> {
                    TenantConfigEntity c = new TenantConfigEntity();
                    c.setTenantId(tenant.getId());
                    return c;
                });

        if (req.mpAccessToken() != null) config.setMpAccessToken(req.mpAccessToken().trim());
        if (req.mpPublicKey()   != null) config.setMpPublicKey(req.mpPublicKey().trim());
        if (req.mpUserId()      != null) config.setMpUserId(req.mpUserId().trim());
        if (req.mpSandbox()     != null) config.setMpSandbox(req.mpSandbox());
        if (req.mpEnabled()     != null) config.setMpEnabled(req.mpEnabled());
        config.setMpUpdatedAt(LocalDateTime.now());
        configRepository.save(config);

        log.info("MP config actualizada para tenant {} — enabled={}", slug, config.getMpEnabled());
        return new MpConfigResponse(
                config.getMpPublicKey() != null ? mask(config.getMpPublicKey()) : null,
                config.getMpUserId(),
                config.getMpSandbox() != null ? config.getMpSandbox() : true,
                config.getMpEnabled() != null ? config.getMpEnabled() : false,
                config.getMpUpdatedAt()
        );
    }

    /** Devuelve la config MP del tenant (sin access token por seguridad). */
    public Optional<MpConfigResponse> getMpConfig(String slug) {
        return tenantRepository.findBySlug(slug).flatMap(tenant -> {
            TenantConfigEntity config = configRepository.findByTenantId(tenant.getId()).orElse(null);
            if (config == null) return Optional.empty();
            return Optional.of(new MpConfigResponse(
                    config.getMpPublicKey() != null ? mask(config.getMpPublicKey()) : null,
                    config.getMpUserId(),
                    config.getMpSandbox() != null ? config.getMpSandbox() : true,
                    config.getMpEnabled() != null ? config.getMpEnabled() : false,
                    config.getMpUpdatedAt()
            ));
        });
    }

    private String mask(String s) {
        if (s == null || s.length() <= 8) return "***";
        return s.substring(0, 8) + "..." + s.substring(s.length() - 4);
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private Tenant toTenant(TenantEntity e) {
        TenantConfigEntity cfg = null;
        try {
            cfg = configRepository.findByTenantId(e.getId()).orElse(null);
        } catch (Exception ex) {
            log.warn("Could not load config for tenant {}: {}", e.getSlug(), ex.getMessage());
        }

        // Resolver plan real: primero de tenant_subscriptions, luego plan_id, default "trial"
        String plan = "trial";
        java.util.List<String> features = List.of("catalog", "reviews");
        try {
            TenantSubscriptionEntity sub = subscriptionRepository.findByTenantId(e.getId()).orElse(null);
            if (sub != null && sub.getCurrentPlan() != null) {
                plan = sub.getCurrentPlan();
            } else if (e.getPlanId() != null) {
                PlanEntity planEntity = planRepository.findById(e.getPlanId()).orElse(null);
                if (planEntity != null) {
                    plan = planEntity.getName();
                }
            }
            // Cargar features del plan
            PlanEntity planEntity = planRepository.findByName(plan).orElse(null);
            if (planEntity != null) {
                // features se calculan según el plan; por ahora usamos defaults
                features = featuresForPlan(plan);
            }
        } catch (Exception ex) {
            log.warn("Could not load subscription/plan for tenant {}: {}", e.getSlug(), ex.getMessage());
        }

        return new Tenant(
                e.getId().toString(),
                e.getSlug(),
                e.getName(),
                e.getTagline(),
                e.getCategory(),
                e.getLocation(),
                plan,
                e.getStatus(),
                e.getRating()         != null ? e.getRating().doubleValue()         : 0.0,
                e.getReviewCount(),
                e.getMonthlyRevenue() != null ? e.getMonthlyRevenue().doubleValue() : 0.0,
                e.getReservationsThisMonth(),
                e.getOrdersThisMonth(),
                e.getPrimaryColor(),
                e.getGradient(),
                e.getDescription(),
                e.getPhone(),
                features,
                cfg != null && cfg.getLat() != null ? cfg.getLat().doubleValue() : null,
                cfg != null && cfg.getLng() != null ? cfg.getLng().doubleValue() : null,
                cfg != null ? cfg.getAddress() : null,
                cfg != null && cfg.getAllowsDelivery() != null ? cfg.getAllowsDelivery() : true,
                cfg != null && cfg.getAllowsPickup()   != null ? cfg.getAllowsPickup()   : true,
                cfg != null ? cfg.getDeliveryFee() : null,
                cfg != null ? cfg.getYapePhone() : null,
                cfg != null ? cfg.getYapeQrUrl()  : null,
                cfg != null ? cfg.getBannerUrl()  : null,
                cfg != null ? cfg.getLogoUrl()    : null
        );
    }

    /** Features por defecto según el plan. */
    private java.util.List<String> featuresForPlan(String plan) {
        return switch (plan) {
            case "trial", "enterprise" -> List.of("catalog", "delivery", "reservations", "reviews", "loyalty", "campaigns", "mp_auto");
            case "premium"             -> List.of("catalog", "delivery", "reservations", "reviews", "loyalty", "campaigns", "mp_auto");
            case "starter"             -> List.of("catalog", "delivery", "reviews", "mp_auto");
            case "free"                -> List.of("catalog", "mp_manual");
            default                    -> List.of("catalog", "reviews");
        };
    }

    private String normalizeSlug(String slug, String name) {
        String base = trimToNull(slug);
        if (base == null) {
            base = name;
        }

        String normalized = Normalizer.normalize(base, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("(^-|-$)", "");

        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Tenant slug cannot be empty");
        }

        return normalized;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String defaultColor(String color) {
        String trimmed = trimToNull(color);
        return trimmed != null ? trimmed : "#0c4a6e";
    }

    private String buildGradient(String primaryColor) {
        return "linear-gradient(135deg," + primaryColor + " 0%,#1d4ed8 100%)";
    }

    private boolean hasConfigPayload(CreateTenantRequest req) {
        return trimToNull(req.address()) != null || trimToNull(req.lat()) != null || trimToNull(req.lng()) != null;
    }

    private BigDecimal parseDecimal(String value) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            return null;
        }
        try {
            return new BigDecimal(trimmed);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

}
