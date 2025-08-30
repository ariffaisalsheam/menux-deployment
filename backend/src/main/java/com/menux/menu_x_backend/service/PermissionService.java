package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.entity.rbac.RbacRole;
import com.menux.menu_x_backend.repository.UserRepository;
import com.menux.menu_x_backend.repository.rbac.RbacRoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class PermissionService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RbacRoleRepository rbacRoleRepository;

    /**
     * Check if the current authenticated user has a specific permission
     */
    public boolean hasPermission(String permission) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }

        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> authority.equals("PERM_" + permission));
    }

    /**
     * Check if the current authenticated user has any of the specified permissions
     */
    public boolean hasAnyPermission(String... permissions) {
        return Arrays.stream(permissions).anyMatch(this::hasPermission);
    }

    /**
     * Check if the current authenticated user has all of the specified permissions
     */
    public boolean hasAllPermissions(String... permissions) {
        return Arrays.stream(permissions).allMatch(this::hasPermission);
    }

    /**
     * Get all permissions for the current authenticated user
     */
    @Transactional(readOnly = true)
    public Set<String> getCurrentUserPermissions() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Collections.emptySet();
        }

        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith("PERM_"))
                .map(authority -> authority.replace("PERM_", ""))
                .collect(Collectors.toSet());
    }

    /**
     * Get all permissions for a specific user by user ID
     */
    @Transactional(readOnly = true)
    public Set<String> getUserPermissions(Long userId) {
        List<RbacRole> userRoles = rbacRoleRepository.findByUsers_Id(userId);
        Set<String> permissions = new HashSet<>();
        
        for (RbacRole role : userRoles) {
            role.getPermissions().forEach(perm -> permissions.add(perm.getKey()));
        }
        
        return permissions;
    }

    /**
     * Get current authenticated user
     */
    public Optional<User> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }

        String username = auth.getName();
        return userRepository.findByUsername(username);
    }

    /**
     * Check if current user can manage a specific user (for hierarchical permissions)
     */
    @Transactional(readOnly = true)
    public boolean canManageUser(Long targetUserId) {
        // Super admins can manage anyone
        if (hasPermission("MANAGE_USERS")) {
            return true;
        }

        // Users cannot manage themselves through admin interface
        Optional<User> currentUser = getCurrentUser();
        if (currentUser.isPresent() && currentUser.get().getId().equals(targetUserId)) {
            return false;
        }

        return false;
    }

    /**
     * Get permission categories for UI organization
     */
    public Map<String, List<String>> getPermissionCategories() {
        Map<String, List<String>> categories = new HashMap<>();
        
        categories.put("User Management", Arrays.asList(
            "MANAGE_USERS", "VIEW_USERS", "CREATE_USERS", "DELETE_USERS"
        ));
        
        categories.put("Restaurant Management", Arrays.asList(
            "MANAGE_RESTAURANTS", "VIEW_RESTAURANTS", "APPROVE_RESTAURANTS"
        ));
        
        categories.put("System Administration", Arrays.asList(
            "MANAGE_RBAC", "VIEW_AUDIT_LOGS", "MANAGE_SUBSCRIPTIONS", "SYSTEM_CONFIG"
        ));
        
        categories.put("Content Management", Arrays.asList(
            "MANAGE_CONTENT", "MODERATE_CONTENT", "UPLOAD_MEDIA"
        ));
        
        return categories;
    }

    /**
     * Check if user has admin-level access
     */
    public boolean isAdmin() {
        return hasAnyPermission("MANAGE_USERS", "MANAGE_RBAC", "MANAGE_RESTAURANTS");
    }

    /**
     * Check if user has super admin access
     */
    public boolean isSuperAdmin() {
        return hasAllPermissions("MANAGE_USERS", "MANAGE_RBAC", "VIEW_AUDIT_LOGS");
    }
}
