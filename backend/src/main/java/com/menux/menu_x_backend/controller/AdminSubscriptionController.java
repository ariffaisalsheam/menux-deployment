package com.menux.menu_x_backend.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.menux.menu_x_backend.dto.subscription.GrantPaidDaysRequest;
import com.menux.menu_x_backend.dto.subscription.RestaurantSubscriptionDTO;
import com.menux.menu_x_backend.dto.subscription.RestaurantSubscriptionEventDTO;
import com.menux.menu_x_backend.dto.subscription.SetPaidDaysRequest;
import com.menux.menu_x_backend.dto.subscription.SetTrialDaysRequest;
import com.menux.menu_x_backend.dto.subscription.SuspendSubscriptionRequest;
import com.menux.menu_x_backend.entity.RestaurantSubscription;
import com.menux.menu_x_backend.repository.RestaurantSubscriptionEventRepository;
import com.menux.menu_x_backend.service.SubscriptionService;

@RestController
@RequestMapping("/api/admin/subscriptions")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminSubscriptionController {

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private RestaurantSubscriptionEventRepository eventRepository;

    @GetMapping("/{restaurantId}")
    public ResponseEntity<?> get(@PathVariable("restaurantId") Long restaurantId) {
        try {
            RestaurantSubscription sub = subscriptionService.ensureSubscription(restaurantId);
            return ResponseEntity.ok(RestaurantSubscriptionDTO.from(sub));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{restaurantId}/grant")
    public ResponseEntity<?> grant(@PathVariable("restaurantId") Long restaurantId, @RequestBody GrantPaidDaysRequest req) {
        try {
            if (req == null || req.getDays() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "days is required"));
            }
            subscriptionService.grantPaidDays(restaurantId, req.getDays(), "ADMIN", null);
            RestaurantSubscription sub = subscriptionService.ensureSubscription(restaurantId);
            return ResponseEntity.ok(RestaurantSubscriptionDTO.from(sub));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{restaurantId}/start-trial")
    public ResponseEntity<?> startTrial(@PathVariable("restaurantId") Long restaurantId) {
        try {
            RestaurantSubscription sub = subscriptionService.startTrial(restaurantId);
            return ResponseEntity.ok(RestaurantSubscriptionDTO.from(sub));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{restaurantId}/set-trial-days")
    public ResponseEntity<?> setTrialDays(@PathVariable("restaurantId") Long restaurantId, @RequestBody SetTrialDaysRequest req) {
        try {
            if (req == null || req.getDays() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "days is required"));
            }
            if (req.getDays() <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "days must be > 0"));
            }
            RestaurantSubscription sub = subscriptionService.setTrialDays(restaurantId, req.getDays());
            return ResponseEntity.ok(RestaurantSubscriptionDTO.from(sub));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{restaurantId}/set-paid-days")
    public ResponseEntity<?> setPaidDays(@PathVariable("restaurantId") Long restaurantId, @RequestBody SetPaidDaysRequest req) {
        try {
            if (req == null || req.getDays() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "days is required"));
            }
            if (req.getDays() <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "days must be > 0"));
            }
            RestaurantSubscription sub = subscriptionService.setPaidDays(restaurantId, req.getDays());
            return ResponseEntity.ok(RestaurantSubscriptionDTO.from(sub));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{restaurantId}/suspend")
    public ResponseEntity<?> suspend(@PathVariable("restaurantId") Long restaurantId, @RequestBody(required = false) SuspendSubscriptionRequest req) {
        try {
            String reason = req != null ? req.getReason() : null;
            RestaurantSubscription sub = subscriptionService.suspend(restaurantId, reason);
            return ResponseEntity.ok(RestaurantSubscriptionDTO.from(sub));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{restaurantId}/unsuspend")
    public ResponseEntity<?> unsuspend(@PathVariable("restaurantId") Long restaurantId) {
        try {
            RestaurantSubscription sub = subscriptionService.unsuspend(restaurantId);
            return ResponseEntity.ok(RestaurantSubscriptionDTO.from(sub));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{restaurantId}/cancel")
    public ResponseEntity<?> cancel(@PathVariable("restaurantId") Long restaurantId) {
        try {
            RestaurantSubscription sub = subscriptionService.cancelSubscription(restaurantId);
            return ResponseEntity.ok(RestaurantSubscriptionDTO.from(sub));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{restaurantId}/events")
    public ResponseEntity<?> events(@PathVariable("restaurantId") Long restaurantId) {
        try {
            RestaurantSubscription sub = subscriptionService.ensureSubscription(restaurantId);
            var list = eventRepository.findBySubscriptionIdOrderByCreatedAtDesc(sub.getId())
                    .stream()
                    .map(RestaurantSubscriptionEventDTO::from)
                    .toList();
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // QA-only: manual trigger of daily lifecycle checks
    @PostMapping("/debug/run-daily")
    public ResponseEntity<?> runDailyNow() {
        try {
            subscriptionService.runDailyChecks();
            return ResponseEntity.ok(Map.of("status", "ok"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Admin: audit and repair subscription inconsistencies
    @PostMapping("/audit-repair")
    public ResponseEntity<?> auditAndRepair() {
        try {
            var report = subscriptionService.auditAndRepairSubscriptions();
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Admin: force expire a subscription
    @PostMapping("/{restaurantId}/force-expire")
    public ResponseEntity<?> forceExpire(@PathVariable("restaurantId") Long restaurantId,
                                       @RequestBody(required = false) Map<String, String> body) {
        try {
            String reason = body != null ? body.get("reason") : "Admin force expire";
            RestaurantSubscription sub = subscriptionService.forceExpireSubscription(restaurantId, reason);
            return ResponseEntity.ok(RestaurantSubscriptionDTO.from(sub));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Admin: validate subscription status
    @GetMapping("/{restaurantId}/validate")
    public ResponseEntity<?> validateSubscription(@PathVariable("restaurantId") Long restaurantId) {
        try {
            boolean isValid = subscriptionService.isValidProSubscription(restaurantId);
            RestaurantSubscription sub = subscriptionService.ensureSubscription(restaurantId);
            return ResponseEntity.ok(Map.of(
                "restaurantId", restaurantId,
                "isValidPro", isValid,
                "currentStatus", sub.getStatus().toString(),
                "currentPlan", sub.getPlan().toString()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Admin: sync subscription data between systems
    @PostMapping("/{restaurantId}/sync")
    public ResponseEntity<?> syncSubscriptionData(@PathVariable("restaurantId") Long restaurantId) {
        try {
            subscriptionService.syncSubscriptionData(restaurantId);
            RestaurantSubscription sub = subscriptionService.ensureSubscription(restaurantId);
            return ResponseEntity.ok(Map.of(
                "message", "Subscription data synchronized successfully",
                "subscription", RestaurantSubscriptionDTO.from(sub)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Admin: validate subscription integrity
    @PostMapping("/{restaurantId}/validate-integrity")
    public ResponseEntity<?> validateIntegrity(@PathVariable("restaurantId") Long restaurantId) {
        try {
            subscriptionService.validateSubscriptionIntegrity(restaurantId);
            return ResponseEntity.ok(Map.of(
                "message", "Subscription data integrity is valid",
                "restaurantId", restaurantId
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
