package com.canete.marketplace.modules.tenant.application;

import com.canete.marketplace.modules.tenant.infrastructure.persistence.PlanEntity;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.PlanRepository;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.TenantSubscriptionEntity;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.TenantSubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Servicio para gestión de trials y suscripciones.
 * - Inicia trial de 14 días para nuevos tenants
 * - Verifica expiración del trial (job programado)
 * - Downgrade automático a "free" cuando expira el trial
 * - Tracking de ventas MP del mes
 */
@Service
public class TrialService {

    private static final Logger log = LoggerFactory.getLogger(TrialService.class);
    private static final int DEFAULT_TRIAL_DAYS = 14;

    private final PlanRepository planRepository;
    private final TenantSubscriptionRepository subscriptionRepository;

    public TrialService(PlanRepository planRepository,
                        TenantSubscriptionRepository subscriptionRepository) {
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    /**
     * Inicia un trial de 14 días para un tenant nuevo.
     * Si ya tiene suscripción, no hace nada.
     */
    @Transactional
    public TenantSubscriptionEntity startTrial(UUID tenantId) {
        Optional<TenantSubscriptionEntity> existing = subscriptionRepository.findByTenantId(tenantId);
        if (existing.isPresent()) {
            return existing.get();
        }

        TenantSubscriptionEntity sub = new TenantSubscriptionEntity();
        sub.setTenantId(tenantId);
        sub.setCurrentPlan("trial");
        sub.setTrialStartedAt(LocalDateTime.now());
        sub.setTrialEndsAt(LocalDateTime.now().plusDays(DEFAULT_TRIAL_DAYS));
        sub.setTrialUsed(true);
        sub.setSubscriptionStatus("none");
        sub.setMpSalesThisMonth(0);
        sub.setMpSalesResetAt(LocalDateTime.now().plusMonths(1));

        log.info("Trial iniciado para tenant {} — termina en {} días", tenantId, DEFAULT_TRIAL_DAYS);
        return subscriptionRepository.save(sub);
    }

    /**
     * Cambia el plan del tenant (upgrade/downgrade).
     * Si era trial y cambia a plan pago, marca suscripción como active.
     */
    @Transactional
    public TenantSubscriptionEntity changePlan(UUID tenantId, String newPlan) {
        TenantSubscriptionEntity sub = subscriptionRepository.findByTenantId(tenantId)
                .orElseGet(() -> {
                    TenantSubscriptionEntity s = new TenantSubscriptionEntity();
                    s.setTenantId(tenantId);
                    return s;
                });

        sub.setCurrentPlan(newPlan);

        if (!"trial".equals(newPlan) && !"free".equals(newPlan)) {
            // Plan pago
            sub.setSubscriptionStatus("active");
            sub.setSubscriptionStartedAt(LocalDateTime.now());
            sub.setSubscriptionRenewalAt(LocalDateTime.now().plusMonths(1));
        } else if ("free".equals(newPlan)) {
            sub.setSubscriptionStatus("none");
        }

        log.info("Plan cambiado para tenant {} → {}", tenantId, newPlan);
        return subscriptionRepository.save(sub);
    }

    /**
     * Verifica si el trial de un tenant ha expirado.
     * Si expiró, lo downgrada a "free" automáticamente.
     */
    @Transactional
    public boolean checkAndDowngradeIfTrialExpired(UUID tenantId) {
        Optional<TenantSubscriptionEntity> opt = subscriptionRepository.findByTenantId(tenantId);
        if (opt.isEmpty()) return false;

        TenantSubscriptionEntity sub = opt.get();
        if (!"trial".equals(sub.getCurrentPlan())) return false;
        if (sub.getTrialEndsAt() == null) return false;

        if (LocalDateTime.now().isAfter(sub.getTrialEndsAt())) {
            sub.setCurrentPlan("free");
            sub.setSubscriptionStatus("none");
            subscriptionRepository.save(sub);
            log.info("Trial expirado para tenant {} → downgrade a free", tenantId);
            return true;
        }
        return false;
    }

    /**
     * Incrementa el contador de ventas MP del mes.
     * Si pasó el reset_at, reinicia el contador.
     */
    @Transactional
    public void incrementMpSale(UUID tenantId) {
        TenantSubscriptionEntity sub = subscriptionRepository.findByTenantId(tenantId)
                .orElseGet(() -> {
                    TenantSubscriptionEntity s = new TenantSubscriptionEntity();
                    s.setTenantId(tenantId);
                    return s;
                });

        // Reset mensual si corresponde
        if (sub.getMpSalesResetAt() != null && LocalDateTime.now().isAfter(sub.getMpSalesResetAt())) {
            sub.setMpSalesThisMonth(0);
            sub.setMpSalesResetAt(LocalDateTime.now().plusMonths(1));
        }

        sub.setMpSalesThisMonth(sub.getMpSalesThisMonth() + 1);
        subscriptionRepository.save(sub);
        log.debug("Venta MP registrada para tenant {} — total mes: {}", tenantId, sub.getMpSalesThisMonth());
    }

    /**
     * Job programado: cada hora, verifica todos los trials expirados y downgrades.
     * En producción esto debería ser más frecuente o dispararse por evento.
     */
    @Scheduled(fixedRate = 3600000) // 1 hora
    @Transactional
    public void processExpiredTrials() {
        // TODO: iterar sobre todas las suscripciones en trial y verificar expiración
        // Por ahora esto es un placeholder — la verificación se hace on-demand
        log.debug("Job de expiración de trials ejecutado");
    }

    /** Devuelve la suscripción del tenant. */
    public Optional<TenantSubscriptionEntity> getSubscription(UUID tenantId) {
        return subscriptionRepository.findByTenantId(tenantId);
    }

    /** Días restantes del trial (0 si ya expiró o no está en trial). */
    public long getTrialDaysRemaining(UUID tenantId) {
        return subscriptionRepository.findByTenantId(tenantId)
                .filter(sub -> "trial".equals(sub.getCurrentPlan()))
                .filter(sub -> sub.getTrialEndsAt() != null)
                .map(sub -> {
                    long days = java.time.Duration.between(LocalDateTime.now(), sub.getTrialEndsAt()).toDays();
                    return Math.max(0, days);
                })
                .orElse(0L);
    }
}
