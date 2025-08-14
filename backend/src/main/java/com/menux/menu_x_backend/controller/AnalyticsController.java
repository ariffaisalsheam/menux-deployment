package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.dto.analytics.BasicAnalyticsDTO;
import com.menux.menu_x_backend.dto.analytics.RestaurantAnalyticsDTO;
import com.menux.menu_x_backend.dto.analytics.FeedbackAnalyticsDTO;
import com.menux.menu_x_backend.dto.analytics.RecentActivityDTO;
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

    @GetMapping("/restaurant/feedback")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<FeedbackAnalyticsDTO> getFeedbackAnalytics() {
        FeedbackAnalyticsDTO analytics = analyticsService.getFeedbackAnalytics();
        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/restaurant/{restaurantId}/feedback")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<FeedbackAnalyticsDTO> getFeedbackAnalyticsById(@PathVariable Long restaurantId) {
        FeedbackAnalyticsDTO analytics = analyticsService.getFeedbackAnalyticsById(restaurantId);
        return ResponseEntity.ok(analytics);
    }

    // Recent Activity
    @GetMapping("/restaurant/activity")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<java.util.List<RecentActivityDTO>> getRecentActivity() {
        return ResponseEntity.ok(analyticsService.getRecentActivity());
    }

    @GetMapping("/restaurant/{restaurantId}/activity")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<java.util.List<RecentActivityDTO>> getRecentActivityById(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(analyticsService.getRecentActivityById(restaurantId));
    }

    // Basic Analytics for non-Pro users
    @GetMapping("/restaurant/basic")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<BasicAnalyticsDTO> getBasicAnalytics() {
        BasicAnalyticsDTO analytics = analyticsService.getBasicAnalytics();
        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/restaurant/{restaurantId}/basic")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<BasicAnalyticsDTO> getBasicAnalyticsById(@PathVariable Long restaurantId) {
        BasicAnalyticsDTO analytics = analyticsService.getBasicAnalyticsById(restaurantId);
        return ResponseEntity.ok(analytics);
    }
}
