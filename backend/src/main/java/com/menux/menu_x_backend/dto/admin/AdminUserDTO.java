package com.menux.menu_x_backend.dto.admin;

import com.menux.menu_x_backend.dto.rbac.RoleDTO;
import com.menux.menu_x_backend.entity.User;

import java.time.LocalDateTime;
import java.util.List;

public class AdminUserDTO {
    
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String role; // Legacy role (SUPER_ADMIN, etc.)
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<RoleDTO> rbacRoles;
    private List<String> permissions; // Flattened permissions from all roles

    // Constructors
    public AdminUserDTO() {}

    public AdminUserDTO(User user, List<RoleDTO> rbacRoles, List<String> permissions) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.phoneNumber = user.getPhoneNumber();
        this.role = user.getRole().name();
        this.isActive = user.getIsActive();
        this.createdAt = user.getCreatedAt();
        this.updatedAt = user.getUpdatedAt();
        this.rbacRoles = rbacRoles;
        this.permissions = permissions;
    }

    public AdminUserDTO(User user, List<RoleDTO> rbacRoles, List<String> permissions, String displayRole) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.phoneNumber = user.getPhoneNumber();
        this.role = displayRole; // Use the calculated display role instead of base role
        this.isActive = user.getIsActive();
        this.createdAt = user.getCreatedAt();
        this.updatedAt = user.getUpdatedAt();
        this.rbacRoles = rbacRoles;
        this.permissions = permissions;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<RoleDTO> getRbacRoles() { return rbacRoles; }
    public void setRbacRoles(List<RoleDTO> rbacRoles) { this.rbacRoles = rbacRoles; }

    public List<String> getPermissions() { return permissions; }
    public void setPermissions(List<String> permissions) { this.permissions = permissions; }
}
