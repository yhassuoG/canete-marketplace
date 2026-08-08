package com.canete.marketplace.modules.analytics.infrastructure.web;

import com.canete.marketplace.modules.analytics.application.AnalyticsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/global")
    public Map<String, Object> getGlobal() {
        return analyticsService.getGlobalMetrics();
    }

    @GetMapping("/global/revenue-series")
    public List<Map<String, Object>> getRevenueSeries() {
        return analyticsService.getRevenueSeries();
    }

    @GetMapping("/global/categories")
    public List<Map<String, Object>> getCategories() {
        return analyticsService.getCategoryBreakdown();
    }

    @GetMapping("/{slug}")
    public Map<String, Object> getBusinessMetrics(@PathVariable String slug) {
        return analyticsService.getBusinessMetrics(slug);
    }
}
