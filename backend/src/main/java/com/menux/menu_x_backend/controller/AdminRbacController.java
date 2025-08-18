package com.menux.menu_x_backend.controller;

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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/rbac")
@PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('PERM_MANAGE_RBAC')")
public class AdminRbacController {

    @Autowired
    private AdminRbacService rbacService;

    // Permissions
    @GetMapping("/permissions")
    public ResponseEntity<List<PermissionDTO>> listPermissions() {
        List<PermissionDTO> dtos = rbacService.listPermissions()
                .stream()
                .map(p -> new PermissionDTO(p.getKey(), p.getDescription()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
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
