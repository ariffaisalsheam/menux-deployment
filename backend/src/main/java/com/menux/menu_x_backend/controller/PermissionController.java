package com.menux.menu_x_backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.service.PermissionService;

@RestController
@RequestMapping("/api/permissions")
public class PermissionController {

    @Autowired
    private PermissionService permissionService;

    @GetMapping("/current")
    public ResponseEntity<Set<String>> getCurrentUserPermissions() {
        Set<String> permissions = permissionService.getCurrentUserPermissions();
        return ResponseEntity.ok(permissions);
    }

    @PostMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkPermissions(@RequestBody List<String> permissions) {
        Map<String, Boolean> results = new HashMap<>();

        for (String permission : permissions) {
            results.put(permission, permissionService.hasPermission(permission));
        }

        return ResponseEntity.ok(results);
    }

    @GetMapping("/debug")
    public ResponseEntity<Map<String, Object>> debugPermissions() {
        Map<String, Object> debug = new HashMap<>();

        // Get current user permissions
        Set<String> permissions = permissionService.getCurrentUserPermissions();
        debug.put("permissions", permissions);

        // Get current user info
        Optional<User> currentUser = permissionService.getCurrentUser();
        if (currentUser.isPresent()) {
            User user = currentUser.get();
            debug.put("userId", user.getId());
            debug.put("username", user.getUsername());
            debug.put("role", user.getRole().name());

            // Check specific permission
            debug.put("hasViewAnalytics", permissionService.hasPermission("VIEW_ANALYTICS"));
            debug.put("hasManageUsers", permissionService.hasPermission("MANAGE_USERS"));
            debug.put("hasManageRestaurants", permissionService.hasPermission("MANAGE_RESTAURANTS"));
        }

        return ResponseEntity.ok(debug);
    }

    @GetMapping("/check/{permission}")
    public ResponseEntity<Boolean> checkPermission(@PathVariable String permission) {
        boolean hasPermission = permissionService.hasPermission(permission);
        return ResponseEntity.ok(hasPermission);
    }

    @GetMapping("/categories")
    public ResponseEntity<Map<String, List<String>>> getPermissionCategories() {
        Map<String, List<String>> categories = permissionService.getPermissionCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Set<String>> getUserPermissions(@PathVariable Long userId) {
        // Only allow if user has permission to view user details
        if (!permissionService.hasPermission("MANAGE_USERS") && !permissionService.hasPermission("VIEW_USERS")) {
            return ResponseEntity.status(403).build();
        }
        
        Set<String> permissions = permissionService.getUserPermissions(userId);
        return ResponseEntity.ok(permissions);
    }

    @GetMapping("/can-manage/{userId}")
    public ResponseEntity<Boolean> canManageUser(@PathVariable Long userId) {
        boolean canManage = permissionService.canManageUser(userId);
        return ResponseEntity.ok(canManage);
    }

    @GetMapping("/admin-status")
    public ResponseEntity<Map<String, Boolean>> getAdminStatus() {
        Map<String, Boolean> status = new HashMap<>();
        status.put("isAdmin", permissionService.isAdmin());
        status.put("isSuperAdmin", permissionService.isSuperAdmin());
        return ResponseEntity.ok(status);
    }
}
