package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.dto.admin.AdminUserDTO;
import com.menux.menu_x_backend.dto.admin.CreateAdminUserRequest;
import com.menux.menu_x_backend.dto.admin.UpdateAdminUserRequest;
import com.menux.menu_x_backend.dto.rbac.PermissionDTO;
import com.menux.menu_x_backend.dto.rbac.RoleDTO;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.entity.rbac.RbacRole;
import com.menux.menu_x_backend.repository.UserRepository;
import com.menux.menu_x_backend.repository.rbac.RbacRoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RbacRoleRepository rbacRoleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditService auditService;

    @Transactional(readOnly = true)
    public Page<AdminUserDTO> listAdminUsers(Pageable pageable) {
        // Get users with SUPER_ADMIN role (these are admin users)
        Page<User> users = userRepository.findByRole(User.Role.SUPER_ADMIN, pageable);
        return users.map(this::convertToAdminUserDTO);
    }

    @Transactional(readOnly = true)
    public List<AdminUserDTO> searchAdminUsers(String searchTerm) {
        List<User> users;
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            users = userRepository.findByRole(User.Role.SUPER_ADMIN);
        } else {
            users = userRepository.findByRoleAndUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrFullNameContainingIgnoreCase(
                User.Role.SUPER_ADMIN, searchTerm, searchTerm, searchTerm);
        }
        return users.stream().map(this::convertToAdminUserDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<AdminUserDTO> getAdminUser(Long userId) {
        return userRepository.findById(userId)
                .filter(user -> user.getRole() == User.Role.SUPER_ADMIN)
                .map(this::convertToAdminUserDTO);
    }

    @Transactional
    public AdminUserDTO createAdminUser(CreateAdminUserRequest request) {
        // Validation
        if (!request.isPasswordConfirmed()) {
            throw new IllegalArgumentException("Password confirmation does not match");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }

        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Create user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(User.Role.SUPER_ADMIN); // All admin users are SUPER_ADMIN
        user.setIsActive(request.getIsActive());

        User savedUser = userRepository.save(user);

        // Assign RBAC roles
        if (request.getRoleIds() != null && !request.getRoleIds().isEmpty()) {
            assignRolesToUser(savedUser.getId(), request.getRoleIds());
        }

        // Audit log
        auditService.log("CREATE_ADMIN_USER", "USER", savedUser.getId().toString(), 
            Map.of("username", savedUser.getUsername(), "email", savedUser.getEmail()));

        return convertToAdminUserDTO(savedUser);
    }

    @Transactional
    public AdminUserDTO updateAdminUser(Long userId, UpdateAdminUserRequest request) {
        User user = userRepository.findById(userId)
                .filter(u -> u.getRole() == User.Role.SUPER_ADMIN)
                .orElseThrow(() -> new IllegalArgumentException("Admin user not found"));

        // Update basic info
        if (request.getEmail() != null) {
            if (userRepository.existsByEmailAndIdNot(request.getEmail(), userId)) {
                throw new IllegalArgumentException("Email already exists");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }

        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }

        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }

        // Update password if requested
        if (request.isPasswordChangeRequested()) {
            if (!request.isPasswordConfirmed()) {
                throw new IllegalArgumentException("Password confirmation does not match");
            }
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        User savedUser = userRepository.save(user);

        // Update RBAC roles
        if (request.getRoleIds() != null) {
            updateUserRoles(userId, request.getRoleIds());
        }

        // Audit log
        auditService.log("UPDATE_ADMIN_USER", "USER", userId.toString(), 
            Map.of("username", user.getUsername()));

        return convertToAdminUserDTO(savedUser);
    }

    @Transactional
    public void deleteAdminUser(Long userId) {
        User user = userRepository.findById(userId)
                .filter(u -> u.getRole() == User.Role.SUPER_ADMIN)
                .orElseThrow(() -> new IllegalArgumentException("Admin user not found"));

        // Remove from all RBAC roles first
        removeUserFromAllRoles(userId);

        // Delete user
        userRepository.delete(user);

        // Audit log
        auditService.log("DELETE_ADMIN_USER", "USER", userId.toString(), 
            Map.of("username", user.getUsername()));
    }

    @Transactional
    public void assignRolesToUser(Long userId, List<Long> roleIds) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<RbacRole> roles = rbacRoleRepository.findAllById(roleIds);
        
        for (RbacRole role : roles) {
            Set<User> users = role.getUsers();
            if (users == null) users = new HashSet<>();
            users.add(user);
            role.setUsers(users);
            rbacRoleRepository.save(role);
        }

        auditService.log("ASSIGN_ROLES_TO_USER", "USER", userId.toString(), 
            Map.of("roleIds", roleIds));
    }

    @Transactional
    public void updateUserRoles(Long userId, List<Long> newRoleIds) {
        // Remove user from all current roles
        removeUserFromAllRoles(userId);
        
        // Assign new roles
        if (newRoleIds != null && !newRoleIds.isEmpty()) {
            assignRolesToUser(userId, newRoleIds);
        }
    }

    @Transactional
    public void removeUserFromAllRoles(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<RbacRole> userRoles = rbacRoleRepository.findByUsers_Id(userId);
        for (RbacRole role : userRoles) {
            role.getUsers().remove(user);
            rbacRoleRepository.save(role);
        }
    }

    private AdminUserDTO convertToAdminUserDTO(User user) {
        // Get user's RBAC roles
        List<RbacRole> userRoles = rbacRoleRepository.findByUsers_Id(user.getId());
        List<RoleDTO> roleDTOs = userRoles.stream()
                .map(this::convertToRoleDTO)
                .collect(Collectors.toList());

        // Get flattened permissions
        Set<String> permissionSet = new HashSet<>();
        for (RbacRole role : userRoles) {
            role.getPermissions().forEach(perm -> permissionSet.add(perm.getKey()));
        }
        List<String> permissions = new ArrayList<>(permissionSet);

        // Determine display role: use primary RBAC role if available, otherwise fall back to base role
        String displayRole = getPrimaryDisplayRole(user, userRoles);

        return new AdminUserDTO(user, roleDTOs, permissions, displayRole);
    }

    private String getPrimaryDisplayRole(User user, List<RbacRole> rbacRoles) {
        // If user has RBAC roles, use the first non-system role as display role
        if (!rbacRoles.isEmpty()) {
            // Prioritize non-system roles (exclude SUPER_ADMIN_RBAC)
            Optional<RbacRole> primaryRole = rbacRoles.stream()
                    .filter(role -> !"SUPER_ADMIN_RBAC".equals(role.getName()))
                    .findFirst();

            if (primaryRole.isPresent()) {
                return primaryRole.get().getName();
            }

            // If only system roles, use the first one
            return rbacRoles.get(0).getName();
        }

        // Fall back to base role if no RBAC roles
        return user.getRole().name();
    }

    private RoleDTO convertToRoleDTO(RbacRole role) {
        List<PermissionDTO> permissionDTOs = role.getPermissions().stream()
                .map(perm -> new PermissionDTO(perm.getKey(), perm.getDescription()))
                .collect(Collectors.toList());
        
        return new RoleDTO(role.getId(), role.getName(), role.getDescription(), permissionDTOs);
    }
}
