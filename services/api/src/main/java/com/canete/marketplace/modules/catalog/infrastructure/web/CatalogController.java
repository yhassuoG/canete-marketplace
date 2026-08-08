package com.canete.marketplace.modules.catalog.infrastructure.web;

import com.canete.marketplace.modules.catalog.application.CreateProductRequest;
import com.canete.marketplace.modules.catalog.application.ListCatalogUseCase;
import com.canete.marketplace.modules.catalog.application.ProductNotFoundException;
import com.canete.marketplace.modules.catalog.application.ProductService;
import com.canete.marketplace.modules.catalog.application.UpdateProductRequest;
import com.canete.marketplace.modules.catalog.domain.Listing;
import com.canete.marketplace.modules.catalog.domain.Product;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/catalog")
@CrossOrigin(origins = "*")
public class CatalogController {

    private final ListCatalogUseCase listCatalogUseCase;
    private final ProductService productService;

    public CatalogController(ListCatalogUseCase listCatalogUseCase, ProductService productService) {
        this.listCatalogUseCase = listCatalogUseCase;
        this.productService = productService;
    }

    @GetMapping("/listings")
    public List<Listing> listings() {
        return listCatalogUseCase.execute();
    }

    // ── Product CRUD (scoped by tenant slug) ──────────────────────────────────

    /** Lista los productos de un tenant. */
    @GetMapping("/{tenantSlug}/products")
    public ResponseEntity<List<Product>> listProducts(@PathVariable String tenantSlug) {
        try {
            return ResponseEntity.ok(productService.findByTenantSlug(tenantSlug));
        } catch (ProductNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /** Crea un producto para un tenant. */
    @PostMapping("/{tenantSlug}/products")
    public ResponseEntity<Product> createProduct(
            @PathVariable String tenantSlug,
            @Valid @RequestBody CreateProductRequest request) {
        try {
            return ResponseEntity.ok(productService.create(tenantSlug, request));
        } catch (ProductNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /** Actualiza un producto de un tenant. */
    @PutMapping("/{tenantSlug}/products/{productId}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable String tenantSlug,
            @PathVariable UUID productId,
            @Valid @RequestBody UpdateProductRequest request) {
        try {
            return ResponseEntity.ok(productService.update(tenantSlug, productId, request));
        } catch (ProductNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /** Elimina un producto de un tenant. */
    @DeleteMapping("/{tenantSlug}/products/{productId}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable String tenantSlug,
            @PathVariable UUID productId) {
        try {
            productService.delete(tenantSlug, productId);
            return ResponseEntity.noContent().build();
        } catch (ProductNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
