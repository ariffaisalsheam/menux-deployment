package com.menux.menu_x_backend.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.menux.menu_x_backend.dto.admin.AdminUserDTO;
import com.menux.menu_x_backend.dto.admin.CreateAdminUserRequest;
import com.menux.menu_x_backend.dto.admin.UpdateAdminUserRequest;
import com.menux.menu_x_backend.service.AdminUserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/admin-users")
@PreAuthorize("hasAuthority('PERM_MANAGE_USERS')")
public class AdminUserController {

    private static final Logger logger = LoggerFactory.getLogger(AdminUserController.class);

    @Autowired
    private AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<Page<AdminUserDTO>> listAdminUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        try {
            Sort sort = sortDir.equalsIgnoreCase("desc") 
                ? Sort.by(sortBy).descending() 
                : Sort.by(sortBy).ascending();
            
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<AdminUserDTO> users = adminUserService.listAdminUsers(pageable);
            
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("Error listing admin users", e);
            throw e;
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<AdminUserDTO>> searchAdminUsers(
            @RequestParam(required = false) String q) {
        
        try {
            List<AdminUserDTO> users = adminUserService.searchAdminUsers(q);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("Error searching admin users", e);
            throw e;
        }
    }

    @GetMapping("/{userId}")
    public ResponseEntity<AdminUserDTO> getAdminUser(@PathVariable Long userId) {
        try {
            return adminUserService.getAdminUser(userId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error getting admin user: " + userId, e);
            throw e;
        }
    }

    @PostMapping
    public ResponseEntity<AdminUserDTO> createAdminUser(@Valid @RequestBody CreateAdminUserRequest request) {
        try {
            AdminUserDTO createdUser = adminUserService.createAdminUser(request);
            logger.info("Created admin user: {}", createdUser.getUsername());
            return ResponseEntity.ok(createdUser);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid admin user creation request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error creating admin user", e);
            throw e;
        }
    }

    @PutMapping("/{userId}")
    public ResponseEntity<AdminUserDTO> updateAdminUser(
            @PathVariable Long userId, 
            @Valid @RequestBody UpdateAdminUserRequest request) {
        
        try {
            AdminUserDTO updatedUser = adminUserService.updateAdminUser(userId, request);
            logger.info("Updated admin user: {}", updatedUser.getUsername());
            return ResponseEntity.ok(updatedUser);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid admin user update request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error updating admin user: " + userId, e);
            throw e;
        }
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteAdminUser(@PathVariable Long userId) {
        try {
            adminUserService.deleteAdminUser(userId);
            logger.info("Deleted admin user: {}", userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid admin user deletion request: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error deleting admin user: " + userId, e);
            throw e;
        }
    }

    @PostMapping("/{userId}/roles")
    public ResponseEntity<Void> assignRolesToUser(
            @PathVariable Long userId, 
            @RequestBody List<Long> roleIds) {
        
        try {
            adminUserService.assignRolesToUser(userId, roleIds);
            logger.info("Assigned roles {} to user {}", roleIds, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid role assignment request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error assigning roles to user: " + userId, e);
            throw e;
        }
    }

    @PutMapping("/{userId}/roles")
    public ResponseEntity<Void> updateUserRoles(
            @PathVariable Long userId, 
            @RequestBody List<Long> roleIds) {
        
        try {
            adminUserService.updateUserRoles(userId, roleIds);
            logger.info("Updated roles for user {} to {}", userId, roleIds);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid role update request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error updating roles for user: " + userId, e);
            throw e;
        }
    }

    @DeleteMapping("/{userId}/roles")
    public ResponseEntity<Void> removeUserFromAllRoles(@PathVariable Long userId) {
        try {
            adminUserService.removeUserFromAllRoles(userId);
            logger.info("Removed all roles from user {}", userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid role removal request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error removing roles from user: " + userId, e);
            throw e;
        }
    }
}
