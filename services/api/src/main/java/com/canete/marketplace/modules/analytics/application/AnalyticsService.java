package com.canete.marketplace.modules.analytics.application;

import com.canete.marketplace.modules.customer.infrastructure.persistence.CustomerEntity;
import com.canete.marketplace.modules.customer.infrastructure.persistence.CustomerRepository;
import com.canete.marketplace.modules.order.infrastructure.persistence.OrderEntity;
import com.canete.marketplace.modules.order.infrastructure.persistence.OrderRepository;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.TenantEntity;
import com.canete.marketplace.modules.tenant.infrastructure.persistence.TenantRepository;
import com.canete.marketplace.modules.user.infrastructure.persistence.UserEntity;
import com.canete.marketplace.modules.user.infrastructure.persistence.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final TenantRepository tenantRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    public AnalyticsService(OrderRepository orderRepository,
                            TenantRepository tenantRepository,
                            CustomerRepository customerRepository,
                            UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.tenantRepository = tenantRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private boolean isSameMonth(LocalDate date, int year, int month) {
        return date.getYear() == year && date.getMonthValue() == month;
    }

    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }
    private double round1(double v) { return Math.round(v * 10.0) / 10.0; }

    // ── Global metrics ───────────────────────────────────────────────────────

    public Map<String, Object> getGlobalMetrics() {
        List<OrderEntity> allOrders = orderRepository.findAll();
        List<TenantEntity> allTenants = tenantRepository.findAll();
        List<UserEntity> allUsers = userRepository.findAll();

        double totalRevenue = allOrders.stream()
            .filter(o -> !"cancelled".equals(o.getStatus()))
            .mapToDouble(o -> o.getTotal().doubleValue())
            .sum();

        long totalTransactions = allOrders.size();
        double avgTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0.0;

        long totalCompanies = allTenants.size();
        long activeCompanies = allTenants.stream()
            .filter(t -> "active".equals(t.getStatus()))
            .count();

        long totalUsers = allUsers.size();

        LocalDate now = LocalDate.now();
        long newUsersThisMonth = allUsers.stream()
            .filter(u -> u.getLastLoginAt() != null
                && isSameMonth(u.getLastLoginAt().toLocalDate(), now.getYear(), now.getMonthValue()))
            .count();

        double thisMonthRevenue = allOrders.stream()
            .filter(o -> !"cancelled".equals(o.getStatus()))
            .filter(o -> o.getCreatedAt() != null
                && isSameMonth(o.getCreatedAt().toLocalDate(), now.getYear(), now.getMonthValue()))
            .mapToDouble(o -> o.getTotal().doubleValue())
            .sum();
        LocalDate prev = now.minusMonths(1);
        double prevMonthRevenue = allOrders.stream()
            .filter(o -> !"cancelled".equals(o.getStatus()))
            .filter(o -> o.getCreatedAt() != null
                && isSameMonth(o.getCreatedAt().toLocalDate(), prev.getYear(), prev.getMonthValue()))
            .mapToDouble(o -> o.getTotal().doubleValue())
            .sum();
        double revenueGrowth = prevMonthRevenue > 0
            ? ((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100.0 : 0.0;

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("totalRevenue", round2(totalRevenue));
        m.put("revenueGrowth", round1(revenueGrowth));
        m.put("totalCompanies", totalCompanies);
        m.put("activeCompanies", activeCompanies);
        m.put("totalUsers", totalUsers);
        m.put("newUsersThisMonth", newUsersThisMonth);
        m.put("totalTransactions", totalTransactions);
        m.put("avgTicket", round2(avgTicket));
        return m;
    }

    // ── Revenue series (last 4 weeks) ────────────────────────────────────────

    public List<Map<String, Object>> getRevenueSeries() {
        List<OrderEntity> allOrders = orderRepository.findAll();
        OffsetDateTime now = OffsetDateTime.now();
        List<Map<String, Object>> series = new ArrayList<>();

        for (int i = 3; i >= 0; i--) {
            OffsetDateTime weekEnd = now.minusWeeks(i);
            OffsetDateTime weekStart = weekEnd.minusWeeks(1);

            double revenue = allOrders.stream()
                .filter(o -> !"cancelled".equals(o.getStatus()))
                .filter(o -> o.getCreatedAt() != null
                    && o.getCreatedAt().isAfter(weekStart) && o.getCreatedAt().isBefore(weekEnd))
                .mapToDouble(o -> o.getTotal().doubleValue())
                .sum();

            long orders = allOrders.stream()
                .filter(o -> o.getCreatedAt() != null
                    && o.getCreatedAt().isAfter(weekStart) && o.getCreatedAt().isBefore(weekEnd))
                .count();

            long reservations = allOrders.stream()
                .filter(o -> o.getCreatedAt() != null
                    && o.getCreatedAt().isAfter(weekStart) && o.getCreatedAt().isBefore(weekEnd))
                .filter(o -> "pickup".equals(o.getDeliveryType()))
                .count();

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("date", weekStart.toLocalDate().toString());
            entry.put("revenue", Math.round(revenue));
            entry.put("orders", orders);
            entry.put("reservations", reservations);
            series.add(entry);
        }
        return series;
    }

    // ── Business metrics (per tenant) ────────────────────────────────────────

    public Map<String, Object> getBusinessMetrics(String slug) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("slug", slug);

        Optional<TenantEntity> tenantOpt = tenantRepository.findBySlug(slug);
        if (tenantOpt.isEmpty()) {
            m.put("totalSales", 0);
            m.put("salesGrowth", 0.0);
            m.put("totalReservations", 0);
            m.put("reservationGrowth", 0.0);
            m.put("totalCustomers", 0);
            m.put("customerGrowth", 0.0);
            m.put("totalOrders", 0);
            m.put("orderGrowth", 0.0);
            m.put("avgRating", 0.0);
            return m;
        }

        TenantEntity tenant = tenantOpt.get();
        UUID tenantId = tenant.getId();

        List<OrderEntity> tenantOrders = orderRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        List<CustomerEntity> tenantCustomers = customerRepository.findByTenantIdOrderByTotalSpentDesc(tenantId);

        double totalSales = tenantOrders.stream()
            .filter(o -> !"cancelled".equals(o.getStatus()))
            .mapToDouble(o -> o.getTotal().doubleValue())
            .sum();

        long totalOrders = tenantOrders.size();
        long totalCustomers = tenantCustomers.size();
        int totalReservations = tenant.getReservationsThisMonth();

        LocalDate now = LocalDate.now();
        LocalDate prev = now.minusMonths(1);

        double thisMonthSales = tenantOrders.stream()
            .filter(o -> !"cancelled".equals(o.getStatus()))
            .filter(o -> o.getCreatedAt() != null
                && isSameMonth(o.getCreatedAt().toLocalDate(), now.getYear(), now.getMonthValue()))
            .mapToDouble(o -> o.getTotal().doubleValue())
            .sum();
        double prevMonthSales = tenantOrders.stream()
            .filter(o -> !"cancelled".equals(o.getStatus()))
            .filter(o -> o.getCreatedAt() != null
                && isSameMonth(o.getCreatedAt().toLocalDate(), prev.getYear(), prev.getMonthValue()))
            .mapToDouble(o -> o.getTotal().doubleValue())
            .sum();
        double salesGrowth = prevMonthSales > 0
            ? ((thisMonthSales - prevMonthSales) / prevMonthSales) * 100.0 : 0.0;

        long thisMonthOrders = tenantOrders.stream()
            .filter(o -> o.getCreatedAt() != null
                && isSameMonth(o.getCreatedAt().toLocalDate(), now.getYear(), now.getMonthValue()))
            .count();
        long prevMonthOrders = tenantOrders.stream()
            .filter(o -> o.getCreatedAt() != null
                && isSameMonth(o.getCreatedAt().toLocalDate(), prev.getYear(), prev.getMonthValue()))
            .count();
        double orderGrowth = prevMonthOrders > 0
            ? ((thisMonthOrders - prevMonthOrders) / (double) prevMonthOrders) * 100.0 : 0.0;

        long thisMonthCustomers = tenantCustomers.stream()
            .filter(c -> c.getCreatedAt() != null
                && isSameMonth(c.getCreatedAt().toLocalDate(), now.getYear(), now.getMonthValue()))
            .count();
        long prevMonthCustomers = tenantCustomers.stream()
            .filter(c -> c.getCreatedAt() != null
                && isSameMonth(c.getCreatedAt().toLocalDate(), prev.getYear(), prev.getMonthValue()))
            .count();
        double customerGrowth = prevMonthCustomers > 0
            ? ((thisMonthCustomers - prevMonthCustomers) / (double) prevMonthCustomers) * 100.0 : 0.0;

        double avgRating = tenant.getRating() != null ? tenant.getRating().doubleValue() : 0.0;

        m.put("totalSales", round2(totalSales));
        m.put("salesGrowth", round1(salesGrowth));
        m.put("totalReservations", totalReservations);
        m.put("reservationGrowth", 0.0);
        m.put("totalCustomers", totalCustomers);
        m.put("customerGrowth", round1(customerGrowth));
        m.put("totalOrders", totalOrders);
        m.put("orderGrowth", round1(orderGrowth));
        m.put("avgRating", avgRating);
        return m;
    }

    // ── Category breakdown ───────────────────────────────────────────────────

    public List<Map<String, Object>> getCategoryBreakdown() {
        List<TenantEntity> allTenants = tenantRepository.findAll();

        Map<String, Long> categoryCounts = allTenants.stream()
            .collect(Collectors.groupingBy(
                t -> t.getCategory() != null ? t.getCategory() : "other",
                Collectors.counting()
            ));

        Map<String, String> categoryColors = Map.of(
            "restaurant", "#0c4a6e",
            "hotel", "#1e3a5f",
            "winery", "#7c3aed",
            "experience", "#064e3b",
            "other", "#64748b"
        );

        List<Map<String, Object>> breakdown = new ArrayList<>();
        categoryCounts.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .forEach(entry -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("category", entry.getKey());
                item.put("value", entry.getValue());
                item.put("color", categoryColors.getOrDefault(entry.getKey(), "#64748b"));
                breakdown.add(item);
            });
        return breakdown;
    }
}
