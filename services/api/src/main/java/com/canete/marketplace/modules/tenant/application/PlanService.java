package com.canete.marketplace.modules.tenant.application;

import com.canete.marketplace.modules.tenant.infrastructure.persistence.PlanEntity;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.PlanRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Servicio para gestión de planes (CRUD + lógica de negocio).
 * Usado por el super-admin para configurar planes y por el sistema para validar límites.
 */
@Service
public class PlanService {

    private static final Logger log = LoggerFactory.getLogger(PlanService.class);

    private final PlanRepository planRepository;

    public PlanService(PlanRepository planRepository) {
        this.planRepository = planRepository;
    }

    /** Lista todos los planes activos ordenados por sort_order. */
    public List<PlanEntity> findAllActive() {
        return planRepository.findByIsActiveTrueOrderBySortOrderAsc();
    }

    /** Busca un plan por nombre. */
    public PlanEntity findByName(String name) {
        return planRepository.findByName(name)
                .orElseThrow(() -> new IllegalArgumentException("Plan no encontrado: " + name));
    }

    /** Actualiza un plan (precio, límites, etc.). Solo super-admin. */
    @Transactional
    public PlanEntity updatePlan(String name, UpdatePlanRequest req) {
        PlanEntity plan = planRepository.findByName(name)
                .orElseThrow(() -> new IllegalArgumentException("Plan no encontrado: " + name));

        if (req.displayName()       != null) plan.setDisplayName(req.displayName());
        if (req.priceMonthly()      != null) plan.setPriceMonthly(req.priceMonthly());
        if (req.maxProducts()       != null) plan.setMaxProducts(req.maxProducts());
        if (req.maxOrdersPerMonth() != null) plan.setMaxOrdersPerMonth(req.maxOrdersPerMonth());
        if (req.trialDays()         != null) plan.setTrialDays(req.trialDays());
        if (req.hasMp()             != null) plan.setHasMp(req.hasMp());
        if (req.maxMpSalesMonth()   != null) plan.setMaxMpSalesMonth(req.maxMpSalesMonth());
        if (req.isActive()          != null) plan.setIsActive(req.isActive());
        if (req.sortOrder()         != null) plan.setSortOrder(req.sortOrder());
        plan.setUpdatedAt(LocalDateTime.now());

        log.info("Plan {} actualizado — price={}, maxProducts={}", name, plan.getPriceMonthly(), plan.getMaxProducts());
        return planRepository.save(plan);
    }

    /**
     * Verifica si un tenant puede usar Mercado Pago automático.
     * - Plan free: no (debe configurar MP manual, limitado a 10 ventas/mes)
     * - Plan trial: sí (trial incluye todo)
     * - Planes pagos: sí si hasMp=true
     */
    public boolean canUseMpAuto(String planName) {
        try {
            PlanEntity plan = findByName(planName);
            return switch (planName) {
                case "trial" -> true;
                case "free"  -> false;
                default      -> Boolean.TRUE.equals(plan.getHasMp());
            };
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Verifica si el tenant puede hacer otra venta MP este mes.
     * @param planName plan actual
     * @param mpSalesThisMonth ventas MP ya hechas este mes
     * @return true si puede vender, false si alcanzó el límite
     */
    public boolean canMakeMpSale(String planName, int mpSalesThisMonth) {
        try {
            PlanEntity plan = findByName(planName);
            int max = plan.getMaxMpSalesMonth();
            // -1 = ilimitado
            return max == -1 || mpSalesThisMonth < max;
        } catch (Exception e) {
            return false;
        }
    }

    // ── DTO ──────────────────────────────────────────────────────────────────

    public record UpdatePlanRequest(
            String displayName,
            BigDecimal priceMonthly,
            Integer maxProducts,
            Integer maxOrdersPerMonth,
            Integer trialDays,
            Boolean hasMp,
            Integer maxMpSalesMonth,
            Boolean isActive,
            Integer sortOrder
    ) {}
}
