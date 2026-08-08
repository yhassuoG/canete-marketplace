package com.canete.marketplace.modules.catalog.application;

import com.canete.marketplace.modules.catalog.domain.Product;
import com.canete.marketplace.modules.catalog.infrastructure.persistence.ProductEntity;
import com.canete.marketplace.modules.catalog.infrastructure.persistence.ProductRepository;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.TenantEntity;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.TenantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final TenantRepository tenantRepository;

    public ProductService(ProductRepository productRepository, TenantRepository tenantRepository) {
        this.productRepository = productRepository;
        this.tenantRepository = tenantRepository;
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    /** Lista los productos de un tenant por su slug. */
    public List<Product> findByTenantSlug(String tenantSlug) {
        TenantEntity tenant = tenantRepository.findBySlug(tenantSlug)
                .orElseThrow(() -> new ProductNotFoundException("Tenant no encontrado: " + tenantSlug));
        return productRepository.findByTenantIdOrderBySortOrderAsc(tenant.getId())
                .stream()
                .map(this::toProduct)
                .toList();
    }

    // ── Mutations ─────────────────────────────────────────────────────────────

    @Transactional
    public Product create(String tenantSlug, CreateProductRequest req) {
        TenantEntity tenant = tenantRepository.findBySlug(tenantSlug)
                .orElseThrow(() -> new ProductNotFoundException("Tenant no encontrado: " + tenantSlug));

        ProductEntity entity = new ProductEntity();
        entity.setTenantId(tenant.getId());
        entity.setName(req.name());
        entity.setDescription(req.description());
        entity.setPrice(BigDecimal.valueOf(req.price()));
        entity.setCategory(req.category());
        entity.setImageUrl(req.imageUrl());
        entity.setAvailable(req.available() != null ? req.available() : true);
        entity.setStock(req.stock());
        entity.setSortOrder(req.sortOrder() != null ? req.sortOrder() : 0);

        return toProduct(productRepository.save(entity));
    }

    @Transactional
    public Product update(String tenantSlug, UUID productId, UpdateProductRequest req) {
        TenantEntity tenant = tenantRepository.findBySlug(tenantSlug)
                .orElseThrow(() -> new ProductNotFoundException("Tenant no encontrado: " + tenantSlug));

        ProductEntity entity = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException("Producto no encontrado: " + productId));

        if (!entity.getTenantId().equals(tenant.getId())) {
            throw new ProductNotFoundException("El producto no pertenece a este tenant");
        }

        entity.setName(req.name());
        entity.setDescription(req.description());
        entity.setPrice(BigDecimal.valueOf(req.price()));
        entity.setCategory(req.category());
        entity.setImageUrl(req.imageUrl());
        if (req.available() != null) entity.setAvailable(req.available());
        entity.setStock(req.stock());
        if (req.sortOrder() != null) entity.setSortOrder(req.sortOrder());

        return toProduct(productRepository.save(entity));
    }

    @Transactional
    public void delete(String tenantSlug, UUID productId) {
        TenantEntity tenant = tenantRepository.findBySlug(tenantSlug)
                .orElseThrow(() -> new ProductNotFoundException("Tenant no encontrado: " + tenantSlug));

        ProductEntity entity = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException("Producto no encontrado: " + productId));

        if (!entity.getTenantId().equals(tenant.getId())) {
            throw new ProductNotFoundException("El producto no pertenece a este tenant");
        }

        productRepository.delete(entity);
    }

    // ── Mapper ────────────────────────────────────────────────────────────────

    private Product toProduct(ProductEntity e) {
        return new Product(
                e.getId().toString(),
                e.getTenantId().toString(),
                e.getName(),
                e.getDescription(),
                e.getPrice(),
                e.getCategory(),
                e.getImageUrl(),
                e.isAvailable(),
                e.getStock(),
                e.getSortOrder()
        );
    }
}
