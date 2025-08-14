package com.menux.menu_x_backend.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.menux.menu_x_backend.service.AIProviderService;
import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.exception.AIServiceException;
// import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.security.RestaurantContext;
import com.menux.menu_x_backend.service.RestaurantService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/ai")
@PreAuthorize("hasRole('RESTAURANT_OWNER')")
public class AIController {

    private static final Logger logger = LoggerFactory.getLogger(AIController.class);

    @Autowired
    private AIProviderService aiProviderService;

    @Autowired
    private RestaurantService restaurantService;

    static class MenuDescriptionRequest {
        @JsonProperty("itemName")
        public String itemName;
    }

    static class FeedbackRequest {
        @JsonProperty("feedback")
        public String feedback;
    }

    @PostMapping("/menu-description")
    public ResponseEntity<Map<String, String>> generateMenuDescription(@RequestBody MenuDescriptionRequest body) {
        logger.info("Received menu description request for item: {}", body.itemName);

        if (!isProSubscriber()) {
            logger.warn("Non-Pro user attempted to access AI features");
            return ResponseEntity.status(403).body(Map.of("error", "Pro subscription required for AI features"));
        }

        try {
            String result = aiProviderService.generateMenuDescription(body.itemName);
            logger.info("AI service returned result: '{}'", result);

            // Standardize response field name to 'description' for frontend compatibility
            Map<String, String> response = Map.of("description", result);
            logger.info("Returning response: {}", response);
            return ResponseEntity.ok(response);
        } catch (AIServiceException e) {
            logger.warn("AI service error: {}", e.getMessage());
            // Return the exact error message from the AI service for detailed debugging
            return ResponseEntity.status(503).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error generating menu description: ", e);
            // Return more detailed error information for debugging
            String detailedError = e.getMessage() != null ? e.getMessage() : "Unknown error occurred";
            return ResponseEntity.status(500).body(Map.of("error", "AI service error: " + detailedError));
        }
    }

    @PostMapping("/feedback-analysis")
    public ResponseEntity<Map<String, String>> analyzeFeedback(@RequestBody FeedbackRequest body) {
        if (!isProSubscriber()) {
            return ResponseEntity.status(403).body(Map.of("error", "Pro subscription required for AI features"));
        }

        try {
            String result = aiProviderService.analyzeFeedback(body.feedback);
            return ResponseEntity.ok(Map.of("result", result));
        } catch (AIServiceException e) {
            logger.warn("AI service error during feedback analysis: {}", e.getMessage());
            // Return the exact error message from the AI service for detailed debugging
            return ResponseEntity.status(503).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error analyzing feedback: ", e);
            // Return more detailed error information for debugging
            String detailedError = e.getMessage() != null ? e.getMessage() : "Unknown error occurred";
            return ResponseEntity.status(500).body(Map.of("error", "AI service error: " + detailedError));
        }
    }

    // Test endpoint for debugging AI providers
    @PostMapping("/test-provider")
    public ResponseEntity<Map<String, Object>> testProvider(@RequestBody TestProviderRequest body) {
        logger.info("Testing AI provider: {}", body.providerType);

        try {
            String result = aiProviderService.testProviderDirectly(body.providerType, body.apiKey, body.prompt);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "provider", body.providerType,
                "result", result
            ));
        } catch (Exception e) {
            logger.error("Provider test failed for {}: ", body.providerType, e);
            return ResponseEntity.ok(Map.of(
                "success", false,
                "provider", body.providerType,
                "error", e.getMessage()
            ));
        }
    }

    private boolean isProSubscriber() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getName() == null) {
                return false;
            }

            // First try to get restaurant ID from JWT context (no database call)
            Long restaurantId = RestaurantContext.getRestaurantId();
            if (restaurantId != null) {
                // Use restaurant service to get subscription plan
                Optional<Restaurant> restaurantOpt = restaurantService.getRestaurantById(restaurantId);
                return restaurantOpt
                        .map(r -> r.getSubscriptionPlan() == Restaurant.SubscriptionPlan.PRO)
                        .orElse(false);
            }

            // Fallback to current user restaurant lookup (with database call)
            return restaurantService.getCurrentUserRestaurant()
                    .map(r -> r.getSubscriptionPlan() == Restaurant.SubscriptionPlan.PRO)
                    .orElse(false);
        } catch (Exception e) {
            // Log error but don't fail the request - return false for safety
            System.err.println("Error checking Pro subscription: " + e.getMessage());
            return false;
        }
    }

    static class FeedbackAnalysisRequest {
        @JsonProperty("feedback")
        public String feedback;
    }

    static class TestProviderRequest {
        @JsonProperty("providerType")
        public String providerType;

        @JsonProperty("apiKey")
        public String apiKey;

        @JsonProperty("prompt")
        public String prompt;
    }
}
