package com.menux.menu_x_backend.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.menux.menu_x_backend.dto.rbac.CreatePermissionRequest;
import com.menux.menu_x_backend.dto.rbac.CreateRoleRequest;
import com.menux.menu_x_backend.dto.rbac.PermissionDTO;
import com.menux.menu_x_backend.dto.rbac.RoleDTO;
import com.menux.menu_x_backend.dto.rbac.SetRolePermissionsRequest;
import com.menux.menu_x_backend.entity.rbac.RbacPermission;
import com.menux.menu_x_backend.entity.rbac.RbacRole;
import com.menux.menu_x_backend.service.AdminRbacService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/admin/rbac")
@PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('PERM_MANAGE_RBAC')")
public class AdminRbacController {

    private static final Logger logger = LoggerFactory.getLogger(AdminRbacController.class);

    @Autowired
    private AdminRbacService rbacService;

    // Test endpoint to debug the issue (remove after fixing)
    @GetMapping("/permissions/test")
    @PreAuthorize("permitAll()")
    public ResponseEntity<String> testPermissions() {
        try {
            List<RbacPermission> permissions = rbacService.listPermissionsWithoutAudit();
            return ResponseEntity.ok("Found " + permissions.size() + " permissions: " +
                permissions.stream().map(RbacPermission::getKey).collect(Collectors.joining(", ")));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    // Permissions
    @GetMapping("/permissions")
    public ResponseEntity<List<PermissionDTO>> listPermissions() {
        try {
            List<PermissionDTO> dtos = rbacService.listPermissions()
                    .stream()
                    .map(p -> new PermissionDTO(p.getKey(), p.getDescription()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            logger.error("Error in listPermissions: {}", e.getMessage(), e);
            throw e; // Re-throw to see the full stack trace
        }
    }

    @PostMapping("/permissions")
    public ResponseEntity<PermissionDTO> createPermission(@RequestBody @Valid CreatePermissionRequest req) {
        RbacPermission p = rbacService.createPermission(req.key, req.description);
        return ResponseEntity.ok(new PermissionDTO(p.getKey(), p.getDescription()));
    }

    // Roles
    @GetMapping("/roles")
    public ResponseEntity<List<RoleDTO>> listRoles() {
        List<RoleDTO> dtos = rbacService.listRoles().stream().map(this::toRoleDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/roles")
    public ResponseEntity<RoleDTO> createRole(@RequestBody @Valid CreateRoleRequest req) {
        RbacRole role = rbacService.createRole(req.name, req.description);
        return ResponseEntity.ok(toRoleDTO(role));
    }

    @DeleteMapping("/roles/{roleId}")
    public ResponseEntity<Void> deleteRole(@PathVariable Long roleId) {
        rbacService.deleteRole(roleId);
        return ResponseEntity.noContent().build();
    }

    public static class UpdateRoleRequest {
        @Size(max = 100)
        public String name;

        @Size(max = 255)
        public String description;
    }

    @PutMapping("/roles/{roleId}")
    public ResponseEntity<RoleDTO> updateRole(@PathVariable Long roleId, @RequestBody @Valid UpdateRoleRequest req) {
        RbacRole updated = rbacService.updateRole(roleId, req.name, req.description);
        return ResponseEntity.ok(toRoleDTO(updated));
    }

    @PutMapping("/roles/{roleId}/permissions")
    public ResponseEntity<RoleDTO> setRolePermissions(@PathVariable Long roleId, @RequestBody @Valid SetRolePermissionsRequest req) {
        RbacRole updated = rbacService.setRolePermissions(roleId, req.permissionKeys);
        return ResponseEntity.ok(toRoleDTO(updated));
    }

    // User-role assignment
    @GetMapping("/users/{userId}/roles")
    public ResponseEntity<List<RoleDTO>> getUserRoles(@PathVariable Long userId) {
        List<RbacRole> userRoles = rbacService.getUserRoles(userId);
        List<RoleDTO> dtos = userRoles.stream().map(this::toRoleDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/users/{userId}/roles/{roleId}")
    public ResponseEntity<Void> assignRoleToUser(@PathVariable Long userId, @PathVariable Long roleId) {
        rbacService.assignRoleToUser(userId, roleId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/{userId}/roles/{roleId}")
    public ResponseEntity<Void> removeRoleFromUser(@PathVariable Long userId, @PathVariable Long roleId) {
        rbacService.removeRoleFromUser(userId, roleId);
        return ResponseEntity.noContent().build();
    }

    private RoleDTO toRoleDTO(RbacRole role) {
        List<PermissionDTO> perms = role.getPermissions() == null ? List.of() : role.getPermissions().stream()
                .map(p -> new PermissionDTO(p.getKey(), p.getDescription()))
                .collect(Collectors.toList());
        return new RoleDTO(role.getId(), role.getName(), role.getDescription(), perms);
    }
}
