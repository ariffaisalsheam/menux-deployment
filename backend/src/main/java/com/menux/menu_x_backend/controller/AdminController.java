package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.dto.admin.UserManagementDTO;
import com.menux.menu_x_backend.dto.admin.RestaurantManagementDTO;
import com.menux.menu_x_backend.dto.admin.PlatformAnalyticsDTO;
import com.menux.menu_x_backend.dto.admin.UpdateUserPlanRequest;
import com.menux.menu_x_backend.service.AdminService;
import com.menux.menu_x_backend.service.NotificationService;
import com.menux.menu_x_backend.entity.Notification;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.repository.DeliveryAttemptRepository;
import com.menux.menu_x_backend.repository.NotificationRepository;
import com.menux.menu_x_backend.repository.UserRepository;
import com.menux.menu_x_backend.dto.notifications.NotificationDto;
import com.menux.menu_x_backend.dto.notifications.DeliveryAttemptDto;
import com.menux.menu_x_backend.dto.common.PageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private DeliveryAttemptRepository deliveryAttemptRepository;

    private Optional<Long> currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return Optional.empty();
        return userRepository.findByUsername(auth.getName()).map(u -> u.getId());
    }

    // User Management Endpoints
    @GetMapping("/users")
    public ResponseEntity<List<UserManagementDTO>> getAllUsers() {
        List<UserManagementDTO> users = adminService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserManagementDTO> getUserById(@PathVariable Long id) {
        UserManagementDTO user = adminService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/users/{id}/plan")
    public ResponseEntity<UserManagementDTO> updateUserPlan(
            @PathVariable Long id, 
            @RequestBody UpdateUserPlanRequest request) {
        UserManagementDTO updatedUser = adminService.updateUserPlan(id, request.getSubscriptionPlan());
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // Restaurant Management Endpoints
    @GetMapping("/restaurants")
    public ResponseEntity<List<RestaurantManagementDTO>> getAllRestaurants() {
        List<RestaurantManagementDTO> restaurants = adminService.getAllRestaurants();
        return ResponseEntity.ok(restaurants);
    }

    @GetMapping("/restaurants/{id}")
    public ResponseEntity<RestaurantManagementDTO> getRestaurantById(@PathVariable Long id) {
        RestaurantManagementDTO restaurant = adminService.getRestaurantById(id);
        return ResponseEntity.ok(restaurant);
    }

    // Platform Analytics Endpoints
    @GetMapping("/analytics")
    public ResponseEntity<PlatformAnalyticsDTO> getPlatformAnalytics() {
        PlatformAnalyticsDTO analytics = adminService.getPlatformAnalytics();
        return ResponseEntity.ok(analytics);
    }

    // System Management Endpoints
    @PostMapping("/users/{id}/activate")
    public ResponseEntity<UserManagementDTO> activateUser(@PathVariable Long id) {
        UserManagementDTO user = adminService.activateUser(id);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/users/{id}/deactivate")
    public ResponseEntity<UserManagementDTO> deactivateUser(@PathVariable Long id) {
        UserManagementDTO user = adminService.deactivateUser(id);
        return ResponseEntity.ok(user);
    }

    // Notifications - Super Admin tools
    @PostMapping("/notifications/test-push")
    public ResponseEntity<Map<String, Object>> sendTestPush(@RequestBody(required = false) Map<String, Object> body) {
        Optional<Long> userIdOpt = currentUserId();
        if (userIdOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("success", false, "error", "Unauthorized"));
        }

        String title = body != null && body.get("title") instanceof String ? (String) body.get("title") : "Test Push";
        String message = body != null && body.get("body") instanceof String ? (String) body.get("body") : "This is a test Web Push from Super Admin";

        Map<String, Object> data = new HashMap<>();
        data.put("source", "admin");
        data.put("kind", "test");
        data.put("timestamp", System.currentTimeMillis());
        if (body != null && body.get("data") instanceof Map<?, ?> extra) {
            // merge extra data
            for (Map.Entry<?, ?> e : extra.entrySet()) {
                if (e.getKey() instanceof String) {
                    data.put((String) e.getKey(), e.getValue());
                }
            }
        }

        var dto = notificationService.createNotification(
                userIdOpt.get(),
                null,
                Notification.Type.GENERIC,
                title,
                message,
                data
        );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "notificationId", dto.getId()
        ));
    }

    // Notifications - Broadcast to roles (phase 1: Restaurant Owners)
    @PostMapping("/notifications/broadcast")
    public ResponseEntity<Map<String, Object>> broadcastNotification(@RequestBody Map<String, Object> body) {
        String title = body != null && body.get("title") instanceof String ? (String) body.get("title") : null;
        String message = body != null && body.get("body") instanceof String ? (String) body.get("body") : null;
        String target = body != null && body.get("target") instanceof String ? (String) body.get("target") : "RESTAURANT_OWNERS";
        if (title == null || title.isBlank() || message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "title and body are required"));
        }

        List<User> recipients;
        if ("RESTAURANT_OWNERS".equalsIgnoreCase(target)) {
            recipients = userRepository.findActiveUsersByRole(User.Role.RESTAURANT_OWNER);
        } else if ("ALL_ACTIVE".equalsIgnoreCase(target)) {
            recipients = userRepository.findByIsActiveTrue();
        } else {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Unsupported target"));
        }

        // Build base data and merge any extra payload from request body
        Map<String, Object> data = new HashMap<>();
        data.put("source", "admin");
        data.put("kind", "broadcast");
        data.put("target", target);
        if (body != null && body.get("data") instanceof Map<?, ?> extra) {
            for (Map.Entry<?, ?> e : extra.entrySet()) {
                if (e.getKey() instanceof String) {
                    data.put((String) e.getKey(), e.getValue());
                }
            }
        }

        int created = 0;
        for (User u : recipients) {
            var dto = notificationService.createNotification(
                    u.getId(),
                    null,
                    Notification.Type.GENERIC,
                    title,
                    message,
                    data
            );
            if (dto != null && dto.getId() != null) created++;
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "target", target,
                "recipients", recipients.size(),
                "created", created
        ));
    }

    // Notifications - Recent across platform
    @GetMapping("/notifications/recent")
    public ResponseEntity<PageResponse<NotificationDto>> listRecent(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)));
        Page<NotificationDto> result = notificationRepository
                .findAllByOrderByCreatedAtDesc(pageable)
                .map(NotificationDto::from);
        return ResponseEntity.ok(PageResponse.from(result));
    }

    // Notifications - Delivery attempts for a notification
    @GetMapping("/notifications/{id}/delivery-attempts")
    public ResponseEntity<List<DeliveryAttemptDto>> getDeliveryAttempts(@PathVariable("id") Long id) {
        var attempts = deliveryAttemptRepository.findByNotificationId(id)
                .stream()
                .map(DeliveryAttemptDto::from)
                .toList();
        return ResponseEntity.ok(attempts);
    }

}
