package com.canete.marketplace.modules.tenant.infrastructure.web;

import com.canete.marketplace.modules.tenant.application.PlanService;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.PlanEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller para gestión de planes (solo super-admin).
 * Permite listar y actualizar planes (precio, límites, etc.).
 */
@RestController
@RequestMapping("/api/admin/plans")
public class PlanController {

    private final PlanService planService;

    public PlanController(PlanService planService) {
        this.planService = planService;
    }

    /** Lista todos los planes activos. */
    @GetMapping
    public ResponseEntity<List<PlanEntity>> listPlans() {
        return ResponseEntity.ok(planService.findAllActive());
    }

    /** Actualiza un plan por nombre. */
    @PutMapping("/{name}")
    public ResponseEntity<PlanEntity> updatePlan(
            @PathVariable String name,
            @RequestBody PlanService.UpdatePlanRequest request) {
        try {
            return ResponseEntity.ok(planService.updatePlan(name, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /** Verifica si un plan puede usar MP automático. */
    @GetMapping("/{name}/can-use-mp")
    public ResponseEntity<Boolean> canUseMp(@PathVariable String name) {
        return ResponseEntity.ok(planService.canUseMpAuto(name));
    }
}
