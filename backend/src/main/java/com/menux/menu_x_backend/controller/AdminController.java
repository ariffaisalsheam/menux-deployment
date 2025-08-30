package com.menux.menu_x_backend.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.menux.menu_x_backend.dto.admin.PlatformAnalyticsDTO;
import com.menux.menu_x_backend.dto.admin.RestaurantManagementDTO;
import com.menux.menu_x_backend.dto.admin.UpdateUserPlanRequest;
import com.menux.menu_x_backend.dto.admin.UpdateUserRequest;
import com.menux.menu_x_backend.dto.admin.UserManagementDTO;
import com.menux.menu_x_backend.dto.auth.AuthResponse;
import com.menux.menu_x_backend.dto.common.PageResponse;
import com.menux.menu_x_backend.dto.notifications.DeliveryAttemptDto;
import com.menux.menu_x_backend.dto.notifications.NotificationDto;
import com.menux.menu_x_backend.entity.Notification;
import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.entity.rbac.RbacPermission;
import com.menux.menu_x_backend.entity.rbac.RbacRole;
import com.menux.menu_x_backend.repository.DeliveryAttemptRepository;
import com.menux.menu_x_backend.repository.NotificationRepository;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.repository.UserRepository;
import com.menux.menu_x_backend.security.JwtUtil;
import com.menux.menu_x_backend.service.AdminRbacService;
import com.menux.menu_x_backend.service.AdminService;
import com.menux.menu_x_backend.service.NotificationService;
import com.menux.menu_x_backend.service.RbacService;
import com.menux.menu_x_backend.service.SystemHealthService;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

    @Autowired
    private AdminService adminService;

    @Autowired
    private AdminRbacService adminRbacService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private DeliveryAttemptRepository deliveryAttemptRepository;

    @Autowired
    private RbacService rbacService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private SystemHealthService systemHealthService;

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

    @GetMapping("/users/restaurant-owners")
    public ResponseEntity<List<UserManagementDTO>> getRestaurantOwners() {
        List<UserManagementDTO> users = adminService.getRestaurantOwners();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserManagementDTO> getUserById(@PathVariable Long id) {
        UserManagementDTO user = adminService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserManagementDTO> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request) {
        UserManagementDTO updatedUser = adminService.updateUser(id, request);
        return ResponseEntity.ok(updatedUser);
    }

    @PutMapping("/users/{id}/plan")
    public ResponseEntity<UserManagementDTO> updateUserPlan(
            @PathVariable Long id,
            @RequestBody UpdateUserPlanRequest request) {
        UserManagementDTO updatedUser = adminService.updateUserPlan(id, request.getSubscriptionPlan());
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('PERM_MANAGE_USERS')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        try {
            logger.info("Attempting to delete user with id: {}", id);
            adminService.deleteUser(id);
            logger.info("Successfully deleted user with id: {}", id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid user deletion request for id {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (RuntimeException e) {
            logger.error("Failed to delete user with id {}: {}", id, e.getMessage(), e);
            // Check if it's a business logic conflict
            if (e.getMessage() != null && (
                e.getMessage().contains("cannot be deleted") ||
                e.getMessage().contains("constraint") ||
                e.getMessage().contains("conflict") ||
                e.getMessage().contains("referenced"))) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
            }
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to delete user");
        } catch (Exception e) {
            logger.error("Unexpected error deleting user with id {}: {}", id, e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error occurred");
        }
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

    // System Health Endpoints
    @GetMapping("/system-health")
    @PreAuthorize("hasAuthority('PERM_VIEW_SYSTEM_HEALTH')")
    public ResponseEntity<SystemHealthService.SystemHealthStatus> getSystemHealth() {
        SystemHealthService.SystemHealthStatus healthStatus = systemHealthService.getDetailedHealthStatus();
        return ResponseEntity.ok(healthStatus);
    }

    // Alternative endpoint for frontend compatibility
    @GetMapping("/system/health")
    @PreAuthorize("hasAuthority('PERM_VIEW_SYSTEM_HEALTH')")
    public ResponseEntity<SystemHealthService.SystemHealthStatus> getSystemHealthAlt() {
        SystemHealthService.SystemHealthStatus healthStatus = systemHealthService.getDetailedHealthStatus();
        return ResponseEntity.ok(healthStatus);
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

    @PostMapping("/users/{id}/switch")
    public ResponseEntity<AuthResponse> switchToUser(@PathVariable Long id) {
        AuthResponse authResponse = adminService.switchToUser(id);
        return ResponseEntity.ok(authResponse);
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
                if (e.getKey() instanceof String key) {
                    data.put(key, e.getValue());
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
                if (e.getKey() instanceof String key) {
                    data.put(key, e.getValue());
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

    // User details for notification context
    @GetMapping("/users/{id}/details")
    public ResponseEntity<Map<String, Object>> getUserDetails(@PathVariable("id") Long id) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Map<String, Object> userDetails = Map.of(
                "id", user.getId(),
                "fullName", user.getFullName() != null ? user.getFullName() : "Unknown User",
                "email", user.getEmail() != null ? user.getEmail() : "unknown@example.com",
                "role", user.getRole().name()
            );

            return ResponseEntity.ok(userDetails);
        } catch (Exception e) {
            // Return fallback data if user not found
            Map<String, Object> fallback = Map.of(
                "id", id,
                "fullName", "User " + id,
                "email", "unknown@example.com",
                "role", "UNKNOWN"
            );
            return ResponseEntity.ok(fallback);
        }
    }

    // Restaurant details for notification context
    @GetMapping("/restaurants/{id}/details")
    public ResponseEntity<Map<String, Object>> getRestaurantDetails(@PathVariable("id") Long id) {
        try {
            Restaurant restaurant = restaurantRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Restaurant not found"));

            Map<String, Object> restaurantDetails = Map.of(
                "id", restaurant.getId(),
                "name", restaurant.getName() != null ? restaurant.getName() : "Unknown Restaurant",
                "address", restaurant.getAddress() != null ? restaurant.getAddress() : "Unknown address",
                "phone", restaurant.getPhoneNumber() != null ? restaurant.getPhoneNumber() : "Unknown phone"
            );

            return ResponseEntity.ok(restaurantDetails);
        } catch (Exception e) {
            // Return fallback data if restaurant not found
            Map<String, Object> fallback = Map.of(
                "id", id,
                "name", "Restaurant " + id,
                "address", "Unknown address",
                "phone", "Unknown phone"
            );
            return ResponseEntity.ok(fallback);
        }
    }

    @PostMapping("/fix-permissions")
    public ResponseEntity<String> fixMissingPermissions() {
        try {
            // Add missing MANAGE_SYSTEM permission
            adminRbacService.createPermission("MANAGE_SYSTEM", "Manage system configuration and settings");

            // Get SUPER_ADMIN_RBAC role and add the permission
            List<RbacRole> roles = adminRbacService.listRoles();
            RbacRole superAdminRole = roles.stream()
                .filter(role -> "SUPER_ADMIN_RBAC".equals(role.getName()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("SUPER_ADMIN_RBAC role not found"));

            // Get current permissions and add MANAGE_SYSTEM
            Set<String> currentPermissions = superAdminRole.getPermissions().stream()
                .map(RbacPermission::getKey)
                .collect(java.util.stream.Collectors.toSet());
            currentPermissions.add("MANAGE_SYSTEM");

            adminRbacService.setRolePermissions(superAdminRole.getId(), new ArrayList<>(currentPermissions));

            return ResponseEntity.ok("Missing permissions added successfully");
        } catch (Exception e) {
            return ResponseEntity.ok("Permission may already exist: " + e.getMessage());
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<Map<String, Object>> refreshUserToken() {
        try {
            // Get current user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
            }

            String username = auth.getName();
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            User user = userOpt.get();

            // Generate new JWT token with latest permissions
            Map<String, Object> extraClaims = new HashMap<>();
            extraClaims.put("role", user.getRole().name());
            extraClaims.put("userId", user.getId());

            // Add RBAC permissions to JWT token
            var rbacPermissions = rbacService.getUserPermissionAuthorities(user.getId());
            var permissionKeys = rbacPermissions.stream()
                    .map(authority -> authority.getAuthority())
                    .filter(perm -> perm.startsWith("PERM_")) // Only include RBAC permissions
                    .map(perm -> perm.replace("PERM_", "")) // Remove PERM_ prefix
                    .collect(java.util.stream.Collectors.toList());
            extraClaims.put("permissions", permissionKeys);

            String newToken = jwtUtil.generateToken(user, extraClaims);

            Map<String, Object> response = new HashMap<>();
            response.put("token", newToken);
            response.put("permissions", permissionKeys);
            response.put("message", "Token refreshed successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to refresh token: " + e.getMessage()));
        }
    }



}
