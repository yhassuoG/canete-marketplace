package com.canete.marketplace.modules.tenant.infrastructure.web;

import com.canete.marketplace.modules.tenant.application.CreateTenantRequest;
import com.canete.marketplace.modules.tenant.application.MpConfigResponse;
import com.canete.marketplace.modules.tenant.application.TenantNotFoundException;
import com.canete.marketplace.modules.tenant.application.TenantSlugAlreadyExistsException;
import com.canete.marketplace.modules.tenant.application.TenantService;
import com.canete.marketplace.modules.tenant.application.UpdateMpConfigRequest;
import com.canete.marketplace.modules.tenant.application.UpdateTenantConfigRequest;
import com.canete.marketplace.modules.tenant.domain.Tenant;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tenants")
@CrossOrigin(origins = "*")
public class TenantController {

    private final TenantService tenantService;

    public TenantController(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    @GetMapping
    public List<Tenant> getAll() {
        return tenantService.findAll();
    }

    @PostMapping
    public ResponseEntity<Tenant> create(@Valid @RequestBody CreateTenantRequest request) {
        try {
            Tenant created = tenantService.createTenant(request);
            return ResponseEntity.ok(created);
        } catch (TenantSlugAlreadyExistsException e) {
            return ResponseEntity.status(409).build();
        }
    }

    @GetMapping("/{slug}")
    public ResponseEntity<Tenant> getBySlug(@PathVariable String slug) {
        return tenantService.findBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Actualiza la configuración dinámica del tenant:
     * nombre, descripción, teléfono, dirección, coordenadas GPS y color primario.
     */
    @PutMapping("/{slug}/config")
    public ResponseEntity<Tenant> updateConfig(
            @PathVariable String slug,
            @RequestBody UpdateTenantConfigRequest request) {
        try {
            Tenant updated = tenantService.updateConfig(slug, request);
            return ResponseEntity.ok(updated);
        } catch (TenantNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Sube una imagen de portada (banner) para el tenant.
     * Guarda el archivo en uploads/tenants/{slug}/banner.{ext}
     * y actualiza banner_url en la base de datos.
     * Retorna la URL pública del banner.
     */
    @PostMapping("/{slug}/config/banner")
    public ResponseEntity<?> uploadBanner(
            @PathVariable String slug,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Archivo vacío"));
            }

            // Validar tipo de contenido
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Solo se permiten imágenes"));
            }

            // Determinar extensión
            String originalName = file.getOriginalFilename();
            String ext = "png";
            if (originalName != null && originalName.contains(".")) {
                ext = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase();
            }

            // Crear directorio uploads/tenants/{slug}/
            Path uploadDir = Paths.get("uploads", "tenants", slug);
            Files.createDirectories(uploadDir);

            // Guardar archivo
            String fileName = "banner." + ext;
            Path filePath = uploadDir.resolve(fileName);
            Files.write(filePath, file.getBytes());

            // URL pública que el frontend puede consumir
            String bannerUrl = "/uploads/tenants/" + slug + "/" + fileName;

            // Actualizar banner_url en la DB via el servicio
            tenantService.updateConfig(slug, new UpdateTenantConfigRequest(
                    null, null, null, null, null, null, null, null,
                    null, null, null, null, null,
                    bannerUrl, null
            ));

            return ResponseEntity.ok(Map.of("bannerUrl", bannerUrl));
        } catch (TenantNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error al guardar: " + e.getMessage()));
        }
    }

    /**
     * Sube un logo (imagen de perfil circular) para el tenant.
     * Guarda el archivo en uploads/tenants/{slug}/logo.{ext}
     * y actualiza logo_url en la base de datos.
     * Retorna la URL pública del logo.
     */
    @PostMapping("/{slug}/config/logo")
    public ResponseEntity<?> uploadLogo(
            @PathVariable String slug,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Archivo vacío"));
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Solo se permiten imágenes"));
            }

            String originalName = file.getOriginalFilename();
            String ext = "png";
            if (originalName != null && originalName.contains(".")) {
                ext = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase();
            }

            Path uploadDir = Paths.get("uploads", "tenants", slug);
            Files.createDirectories(uploadDir);

            String fileName = "logo." + ext;
            Path filePath = uploadDir.resolve(fileName);
            Files.write(filePath, file.getBytes());

            String logoUrl = "/uploads/tenants/" + slug + "/" + fileName;

            tenantService.updateConfig(slug, new UpdateTenantConfigRequest(
                    null, null, null, null, null, null, null, null,
                    null, null, null, null, null,
                    null, logoUrl
            ));

            return ResponseEntity.ok(Map.of("logoUrl", logoUrl));
        } catch (TenantNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error al guardar: " + e.getMessage()));
        }
    }

    // ── Mercado Pago (multi-tenant) ──────────────────────────────────────────

    /**
     * Guarda las credenciales de Mercado Pago del tenant.
     * El tenant configura su propia cuenta MP desde el dashboard /pagos.
     */
    @PutMapping("/{slug}/mp-config")
    public ResponseEntity<MpConfigResponse> updateMpConfig(
            @PathVariable String slug,
            @RequestBody UpdateMpConfigRequest request) {
        try {
            MpConfigResponse resp = tenantService.updateMpConfig(slug, request);
            return ResponseEntity.ok(resp);
        } catch (TenantNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Devuelve la config MP del tenant (sin access token por seguridad).
     */
    @GetMapping("/{slug}/mp-config")
    public ResponseEntity<MpConfigResponse> getMpConfig(@PathVariable String slug) {
        return tenantService.getMpConfig(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
