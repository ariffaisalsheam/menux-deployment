package com.menux.menu_x_backend.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.menux.menu_x_backend.service.AIProviderService;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.repository.UserRepository;
import com.menux.menu_x_backend.repository.RestaurantRepository;
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

    @Autowired
    private AIProviderService aiProviderService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

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
        if (!isProSubscriber()) {
            return ResponseEntity.status(403).body(Map.of("error", "Pro subscription required for AI features"));
        }
        String result = aiProviderService.generateMenuDescription(body.itemName);
        return ResponseEntity.ok(Map.of("result", result));
    }

    @PostMapping("/feedback-analysis")
    public ResponseEntity<Map<String, String>> analyzeFeedback(@RequestBody FeedbackRequest body) {
        if (!isProSubscriber()) {
            return ResponseEntity.status(403).body(Map.of("error", "Pro subscription required for AI features"));
        }
        String result = aiProviderService.analyzeFeedback(body.feedback);
        return ResponseEntity.ok(Map.of("result", result));
    }

    private boolean isProSubscriber() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();
        Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerId(user.getId());

        if (restaurantOpt.isEmpty()) {
            return false;
        }

        return restaurantOpt.get().getSubscriptionPlan() == Restaurant.SubscriptionPlan.PRO;
    }
}
