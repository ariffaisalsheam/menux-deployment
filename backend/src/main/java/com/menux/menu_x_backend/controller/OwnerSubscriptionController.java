package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.dto.subscription.RestaurantSubscriptionDTO;
import com.menux.menu_x_backend.entity.RestaurantSubscription;
import com.menux.menu_x_backend.dto.subscription.RestaurantSubscriptionEventDTO;
import com.menux.menu_x_backend.repository.RestaurantSubscriptionEventRepository;
import com.menux.menu_x_backend.service.RestaurantService;
import com.menux.menu_x_backend.service.SubscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/owner/subscription")
@PreAuthorize("hasRole('RESTAURANT_OWNER')")
public class OwnerSubscriptionController {

    @Autowired
    private RestaurantService restaurantService;

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private RestaurantSubscriptionEventRepository eventRepository;

    @GetMapping
    public ResponseEntity<?> getStatus() {
        var optRid = restaurantService.getCurrentUserRestaurantId();
        if (optRid.isEmpty()) {
            return ResponseEntity.status(404).body(java.util.Map.of("error", "No restaurant for current owner"));
        }
        Long rid = optRid.get();
        RestaurantSubscription sub = subscriptionService.ensureSubscription(rid);
        return ResponseEntity.ok(RestaurantSubscriptionDTO.from(sub));
    }

    @PostMapping("/start-trial")
    public ResponseEntity<?> startTrial() {
        var optRid = restaurantService.getCurrentUserRestaurantId();
        if (optRid.isEmpty()) {
            return ResponseEntity.status(404).body(java.util.Map.of("error", "No restaurant for current owner"));
        }
        Long rid = optRid.get();
        try {
            RestaurantSubscription sub = subscriptionService.startTrial(rid);
            return ResponseEntity.ok(RestaurantSubscriptionDTO.from(sub));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/events")
    public ResponseEntity<?> events() {
        var optRid = restaurantService.getCurrentUserRestaurantId();
        if (optRid.isEmpty()) {
            return ResponseEntity.status(404).body(java.util.Map.of("error", "No restaurant for current owner"));
        }
        Long rid = optRid.get();
        RestaurantSubscription sub = subscriptionService.ensureSubscription(rid);
        var list = eventRepository.findBySubscriptionIdOrderByCreatedAtDesc(sub.getId())
                .stream()
                .map(RestaurantSubscriptionEventDTO::from)
                .toList();
        return ResponseEntity.ok(list);
    }
}
