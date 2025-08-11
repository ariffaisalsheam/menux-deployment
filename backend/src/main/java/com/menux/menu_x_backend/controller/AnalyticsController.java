package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.dto.analytics.RestaurantAnalyticsDTO;
import com.menux.menu_x_backend.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/restaurant")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<RestaurantAnalyticsDTO> getRestaurantAnalytics() {
        RestaurantAnalyticsDTO analytics = analyticsService.getRestaurantAnalytics();
        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/restaurant/{restaurantId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<RestaurantAnalyticsDTO> getRestaurantAnalyticsById(@PathVariable Long restaurantId) {
        RestaurantAnalyticsDTO analytics = analyticsService.getRestaurantAnalyticsById(restaurantId);
        return ResponseEntity.ok(analytics);
    }
}
