package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.dto.admin.UserManagementDTO;
import com.menux.menu_x_backend.dto.admin.RestaurantManagementDTO;
import com.menux.menu_x_backend.dto.admin.PlatformAnalyticsDTO;
import com.menux.menu_x_backend.dto.admin.UpdateUserPlanRequest;
import com.menux.menu_x_backend.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;

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
}
