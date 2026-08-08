package com.canete.marketplace.modules.tenant.application;

import com.canete.marketplace.modules.tenant.domain.Tenant;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.TenantConfigEntity;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.TenantConfigRepository;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.TenantEntity;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TenantServiceTest {

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private TenantConfigRepository configRepository;

    @InjectMocks
    private TenantService tenantService;

    // ── Helpers ──────────────────────────────────────────────────────────────

    private UUID tenantId;
    private TenantEntity activeEntity;
    private TenantConfigEntity configEntity;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();

        activeEntity = new TenantEntity();
        activeEntity.setSlug("muelle-pacifico");
        activeEntity.setName("Muelle Pacifico");
        activeEntity.setTagline("El mejor ceviche de Cañete");
        activeEntity.setCategory("restaurant");
        activeEntity.setLocation("San Vicente de Cañete");
        activeEntity.setStatus("active");
        activeEntity.setPrimaryColor("#0c4a6e");
        activeEntity.setGradient("linear-gradient(135deg,#0c4a6e 0%,#1d4ed8 100%)");
        activeEntity.setDescription("Restaurante de pescados y mariscos");
        activeEntity.setPhone("+51 944 001 001");
        activeEntity.setRating(new BigDecimal("4.9"));
        activeEntity.setReviewCount(312);
        activeEntity.setMonthlyRevenue(new BigDecimal("16550.00"));
        activeEntity.setReservationsThisMonth(32);
        activeEntity.setOrdersThisMonth(18);

        configEntity = new TenantConfigEntity();
        configEntity.setTenantId(tenantId);
        configEntity.setLat(new BigDecimal("-13.0750000"));
        configEntity.setLng(new BigDecimal("-76.4610000"));
        configEntity.setAddress("Av. Costanera 123");
    }

    private TenantEntity savedEntity() {
        // Simulate what JPA would set after save
        try {
            var idField = TenantEntity.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(activeEntity, tenantId);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return activeEntity;
    }

    private CreateTenantRequest validRequest() {
        return new CreateTenantRequest(
            "Muelle Pacifico",    // name
            "muelle-pacifico",    // slug
            "restaurant",         // category
            "San Vicente",        // location
            "El mejor ceviche",   // tagline
            "Pescados y mariscos",// description
            "+51 944 001 001",    // phone
            "Av. Costanera 123",  // address
            "-13.075",            // lat
            "-76.461",            // lng
            "#0c4a6e"             // primaryColor
        );
    }

    // ── findAll ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("findAll()")
    class FindAll {

        @Test
        @DisplayName("returns active tenants from DB")
        void returnsActiveTenants() {
            when(tenantRepository.findByStatus("active")).thenReturn(List.of(activeEntity));
            when(configRepository.findByTenantId(any())).thenReturn(Optional.of(configEntity));

            List<Tenant> result = tenantService.findAll();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).slug()).isEqualTo("muelle-pacifico");
            assertThat(result.get(0).name()).isEqualTo("Muelle Pacifico");
            verify(tenantRepository).findByStatus("active");
        }

        @Test
        @DisplayName("returns empty list when no active tenants")
        void returnsEmptyWhenNone() {
            when(tenantRepository.findByStatus("active")).thenReturn(List.of());

            List<Tenant> result = tenantService.findAll();

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("falls back to mock data when DB is unavailable")
        void fallsBackToMockOnDbError() {
            when(tenantRepository.findByStatus("active")).thenThrow(new RuntimeException("Connection refused"));

            List<Tenant> result = tenantService.findAll();

            assertThat(result).isNotEmpty();
            assertThat(result).anySatisfy(t -> assertThat(t.slug()).isEqualTo("muelle-pacifico"));
        }
    }

    // ── findBySlug ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("findBySlug()")
    class FindBySlug {

        @Test
        @DisplayName("returns tenant when slug exists")
        void returnsTenantWhenFound() {
            when(tenantRepository.findBySlug("muelle-pacifico")).thenReturn(Optional.of(activeEntity));
            when(configRepository.findByTenantId(any())).thenReturn(Optional.of(configEntity));

            Optional<Tenant> result = tenantService.findBySlug("muelle-pacifico");

            assertThat(result).isPresent();
            assertThat(result.get().slug()).isEqualTo("muelle-pacifico");
            assertThat(result.get().lat()).isCloseTo(-13.075, within(0.001));
        }

        @Test
        @DisplayName("returns empty when slug does not exist")
        void returnsEmptyWhenNotFound() {
            when(tenantRepository.findBySlug("unknown")).thenReturn(Optional.empty());

            Optional<Tenant> result = tenantService.findBySlug("unknown");

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("falls back to mock data when DB is unavailable")
        void fallsBackToMockOnDbError() {
            when(tenantRepository.findBySlug("muelle-pacifico")).thenThrow(new RuntimeException("DB down"));

            Optional<Tenant> result = tenantService.findBySlug("muelle-pacifico");

            assertThat(result).isPresent();
            assertThat(result.get().slug()).isEqualTo("muelle-pacifico");
        }

        @Test
        @DisplayName("returns empty from mock fallback when slug not in mocks")
        void fallsBackToMockButSlugNotFound() {
            when(tenantRepository.findBySlug("nonexistent")).thenThrow(new RuntimeException("DB down"));

            Optional<Tenant> result = tenantService.findBySlug("nonexistent");

            assertThat(result).isEmpty();
        }
    }

    // ── createTenant ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("createTenant()")
    class CreateTenant {

        @Test
        @DisplayName("creates tenant with all fields including config")
        void createsTenantWithConfig() {
            CreateTenantRequest req = validRequest();
            TenantEntity saved = savedEntity();

            when(tenantRepository.existsBySlug("muelle-pacifico")).thenReturn(false);
            when(tenantRepository.save(any(TenantEntity.class))).thenAnswer(inv -> {
                TenantEntity e = inv.getArgument(0);
                try {
                    var idField = TenantEntity.class.getDeclaredField("id");
                    idField.setAccessible(true);
                    idField.set(e, tenantId);
                } catch (Exception ex) { throw new RuntimeException(ex); }
                return e;
            });
            when(configRepository.findByTenantId(tenantId)).thenReturn(Optional.of(configEntity));

            Tenant result = tenantService.createTenant(req);

            assertThat(result.slug()).isEqualTo("muelle-pacifico");
            assertThat(result.name()).isEqualTo("Muelle Pacifico");
            assertThat(result.category()).isEqualTo("restaurant");
            assertThat(result.status()).isEqualTo("active");
            assertThat(result.rating()).isEqualTo(0.0);
            assertThat(result.primaryColor()).isEqualTo("#0c4a6e");
            assertThat(result.gradient()).startsWith("linear-gradient");

            // Config was saved because request had address/lat/lng
            verify(configRepository).save(any(TenantConfigEntity.class));
        }

        @Test
        @DisplayName("creates tenant without config when no address/lat/lng")
        void createsTenantWithoutConfig() {
            CreateTenantRequest req = new CreateTenantRequest(
                "Viña del Sol", null, "winery", "Lunahuaná",
                "Vinos peruanos", null, null, null, null, null, null
            );

            when(tenantRepository.existsBySlug("vina-del-sol")).thenReturn(false);
            when(tenantRepository.save(any(TenantEntity.class))).thenAnswer(inv -> {
                TenantEntity e = inv.getArgument(0);
                try {
                    var idField = TenantEntity.class.getDeclaredField("id");
                    idField.setAccessible(true);
                    idField.set(e, tenantId);
                } catch (Exception ex) { throw new RuntimeException(ex); }
                return e;
            });
            when(configRepository.findByTenantId(tenantId)).thenReturn(Optional.empty());

            Tenant result = tenantService.createTenant(req);

            assertThat(result.slug()).isEqualTo("vina-del-sol");
            assertThat(result.primaryColor()).isEqualTo("#0c4a6e"); // default color
            // Config was NOT saved
            verify(configRepository, never()).save(any());
        }

        @Test
        @DisplayName("throws when slug already exists")
        void throwsWhenSlugExists() {
            CreateTenantRequest req = validRequest();
            when(tenantRepository.existsBySlug("muelle-pacifico")).thenReturn(true);

            assertThatThrownBy(() -> tenantService.createTenant(req))
                .isInstanceOf(TenantSlugAlreadyExistsException.class)
                .hasMessageContaining("muelle-pacifico");

            verify(tenantRepository, never()).save(any());
        }

        @Test
        @DisplayName("throws IllegalArgumentException on DataIntegrityViolation")
        void throwsOnDataIntegrityViolation() {
            CreateTenantRequest req = validRequest();
            when(tenantRepository.existsBySlug("muelle-pacifico")).thenReturn(false);
            when(tenantRepository.save(any(TenantEntity.class)))
                .thenThrow(new DataIntegrityViolationException("constraint violation"));

            assertThatThrownBy(() -> tenantService.createTenant(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not valid for persistence");
        }

        @Test
        @DisplayName("normalizes slug from name when slug is null")
        void normalizesSlugFromName() {
            CreateTenantRequest req = new CreateTenantRequest(
                "Paraíso Lunahuaná", null, "experience", "Lunahuaná",
                null, null, null, null, null, null, null
            );

            when(tenantRepository.existsBySlug("paraiso-lunahuana")).thenReturn(false);
            when(tenantRepository.save(any(TenantEntity.class))).thenAnswer(inv -> {
                TenantEntity e = inv.getArgument(0);
                assertThat(e.getSlug()).isEqualTo("paraiso-lunahuana");
                try {
                    var idField = TenantEntity.class.getDeclaredField("id");
                    idField.setAccessible(true);
                    idField.set(e, tenantId);
                } catch (Exception ex) { throw new RuntimeException(ex); }
                return e;
            });
            when(configRepository.findByTenantId(tenantId)).thenReturn(Optional.empty());

            Tenant result = tenantService.createTenant(req);
            assertThat(result.slug()).isEqualTo("paraiso-lunahuana");
        }

        @Test
        @DisplayName("normalizes slug: removes accents, lowercase, hyphens")
        void normalizesSlugAccentsAndCase() {
            CreateTenantRequest req = new CreateTenantRequest(
                "Café Ñandú", "CAFÉ-ÑANDÚ", "restaurant", "Cañete",
                null, null, null, null, null, null, null
            );

            when(tenantRepository.existsBySlug(anyString())).thenReturn(false);
            when(tenantRepository.save(any(TenantEntity.class))).thenAnswer(inv -> {
                TenantEntity e = inv.getArgument(0);
                assertThat(e.getSlug()).isEqualTo("cafe-nandu");
                try {
                    var idField = TenantEntity.class.getDeclaredField("id");
                    idField.setAccessible(true);
                    idField.set(e, tenantId);
                } catch (Exception ex) { throw new RuntimeException(ex); }
                return e;
            });
            when(configRepository.findByTenantId(tenantId)).thenReturn(Optional.empty());

            tenantService.createTenant(req);
        }

        @Test
        @DisplayName("throws when both slug and name produce empty normalized slug")
        void throwsOnEmptySlug() {
            CreateTenantRequest req = new CreateTenantRequest(
                "!!!", "!!!", "restaurant", "Cañete",
                null, null, null, null, null, null, null
            );

            assertThatThrownBy(() -> tenantService.createTenant(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot be empty");
        }

        @Test
        @DisplayName("trims whitespace from name, category, location")
        void trimsWhitespace() {
            CreateTenantRequest req = new CreateTenantRequest(
                "  Hotel Luna  ", "hotel-luna", "  HOTEL  ", "  San Vicente  ",
                null, null, null, null, null, null, null
            );

            when(tenantRepository.existsBySlug("hotel-luna")).thenReturn(false);
            when(tenantRepository.save(any(TenantEntity.class))).thenAnswer(inv -> {
                TenantEntity e = inv.getArgument(0);
                assertThat(e.getName()).isEqualTo("Hotel Luna");
                assertThat(e.getCategory()).isEqualTo("hotel");
                assertThat(e.getLocation()).isEqualTo("San Vicente");
                try {
                    var idField = TenantEntity.class.getDeclaredField("id");
                    idField.setAccessible(true);
                    idField.set(e, tenantId);
                } catch (Exception ex) { throw new RuntimeException(ex); }
                return e;
            });
            when(configRepository.findByTenantId(tenantId)).thenReturn(Optional.empty());

            tenantService.createTenant(req);
        }

        @Test
        @DisplayName("uses default color when primaryColor is null")
        void usesDefaultColorWhenNull() {
            CreateTenantRequest req = new CreateTenantRequest(
                "Test", null, "restaurant", "Loc",
                null, null, null, null, null, null, null
            );

            when(tenantRepository.existsBySlug(anyString())).thenReturn(false);
            when(tenantRepository.save(any(TenantEntity.class))).thenAnswer(inv -> {
                TenantEntity e = inv.getArgument(0);
                assertThat(e.getPrimaryColor()).isEqualTo("#0c4a6e");
                assertThat(e.getGradient()).isEqualTo("linear-gradient(135deg,#0c4a6e 0%,#1d4ed8 100%)");
                try {
                    var idField = TenantEntity.class.getDeclaredField("id");
                    idField.setAccessible(true);
                    idField.set(e, tenantId);
                } catch (Exception ex) { throw new RuntimeException(ex); }
                return e;
            });
            when(configRepository.findByTenantId(tenantId)).thenReturn(Optional.empty());

            tenantService.createTenant(req);
        }
    }

    // ── updateConfig ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateConfig()")
    class UpdateConfig {

        @Test
        @DisplayName("updates tenant fields and config")
        void updatesTenantAndConfig() {
            TenantEntity entity = savedEntity();
            when(tenantRepository.findBySlug("muelle-pacifico")).thenReturn(Optional.of(entity));
            when(configRepository.findByTenantId(tenantId)).thenReturn(Optional.of(configEntity));
            when(tenantRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(configRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UpdateTenantConfigRequest req = new UpdateTenantConfigRequest(
                "Nuevo Nombre", "Nuevo Tagline", "Nueva desc", "+51 999",
                "Nueva dirección", "-13.080", "-76.470", "#ff0000",
                null, null, null, null, null, null, null
            );

            Tenant result = tenantService.updateConfig("muelle-pacifico", req);

            assertThat(result.name()).isEqualTo("Nuevo Nombre");
            verify(tenantRepository).save(argThat(e ->
                e.getName().equals("Nuevo Nombre") &&
                e.getPrimaryColor().equals("#ff0000")
            ));
            verify(configRepository).save(argThat(c ->
                c.getAddress().equals("Nueva dirección")
            ));
        }

        @Test
        @DisplayName("creates config when it does not exist (upsert)")
        void createsConfigWhenMissing() {
            TenantEntity entity = savedEntity();
            when(tenantRepository.findBySlug("muelle-pacifico")).thenReturn(Optional.of(entity));
            when(configRepository.findByTenantId(tenantId)).thenReturn(Optional.empty());
            when(tenantRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(configRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UpdateTenantConfigRequest req = new UpdateTenantConfigRequest(
                null, null, null, null,
                "Nueva dirección", null, null, null,
                null, null, null, null, null, null, null
            );

            Tenant result = tenantService.updateConfig("muelle-pacifico", req);

            verify(configRepository).save(argThat(c ->
                c.getTenantId().equals(tenantId) &&
                c.getAddress().equals("Nueva dirección")
            ));
        }

        @Test
        @DisplayName("throws TenantNotFoundException when slug does not exist")
        void throwsWhenNotFound() {
            when(tenantRepository.findBySlug("unknown")).thenReturn(Optional.empty());

            UpdateTenantConfigRequest req = new UpdateTenantConfigRequest(
                "name", null, null, null, null, null, null, null,
                null, null, null, null, null, null, null
            );

            assertThatThrownBy(() -> tenantService.updateConfig("unknown", req))
                .isInstanceOf(TenantNotFoundException.class)
                .hasMessageContaining("unknown");
        }

        @Test
        @DisplayName("skips null/blank fields on update")
        void skipsNullFields() {
            TenantEntity entity = savedEntity();
            when(tenantRepository.findBySlug("muelle-pacifico")).thenReturn(Optional.of(entity));
            when(configRepository.findByTenantId(tenantId)).thenReturn(Optional.of(configEntity));
            when(tenantRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(configRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UpdateTenantConfigRequest req = new UpdateTenantConfigRequest(
                null, "  ", null, null, null, null, null, null,
                null, null, null, null, null, null, null
            );

            tenantService.updateConfig("muelle-pacifico", req);

            verify(tenantRepository).save(argThat(e ->
                e.getName().equals("Muelle Pacifico") &&  // unchanged
                e.getTagline() == null                      // blank -> not set
            ));
        }

        @Test
        @DisplayName("ignores invalid lat/lng format gracefully")
        void ignoresInvalidLatLng() {
            TenantEntity entity = savedEntity();
            when(tenantRepository.findBySlug("muelle-pacifico")).thenReturn(Optional.of(entity));
            when(configRepository.findByTenantId(tenantId)).thenReturn(Optional.of(configEntity));
            when(tenantRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(configRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UpdateTenantConfigRequest req = new UpdateTenantConfigRequest(
                null, null, null, null, null, "not-a-number", "also-bad", null,
                null, null, null, null, null, null, null
            );

            tenantService.updateConfig("muelle-pacifico", req);

            // lat/lng should remain unchanged (original values from configEntity)
            verify(configRepository).save(argThat(c ->
                c.getLat().equals(new BigDecimal("-13.0750000")) &&
                c.getLng().equals(new BigDecimal("-76.4610000"))
            ));
        }
    }
}
