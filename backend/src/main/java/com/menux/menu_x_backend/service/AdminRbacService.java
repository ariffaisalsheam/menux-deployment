package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.entity.rbac.RbacPermission;
import com.menux.menu_x_backend.entity.rbac.RbacRole;
import com.menux.menu_x_backend.repository.UserRepository;
import com.menux.menu_x_backend.repository.rbac.RbacPermissionRepository;
import com.menux.menu_x_backend.repository.rbac.RbacRoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AdminRbacService {

    @Autowired
    private RbacRoleRepository roleRepository;

    @Autowired
    private RbacPermissionRepository permissionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditService auditService;

    @Transactional(readOnly = true)
    public List<RbacPermission> listPermissions() {
        List<RbacPermission> permissions = permissionRepository.findAll();
        auditService.log("LIST_PERMISSIONS", "RBAC_PERMISSION", null, null);
        return permissions;
    }

    @Transactional
    public RbacPermission createPermission(String key, String description) {
        RbacPermission p = new RbacPermission(key, description);
        RbacPermission saved = permissionRepository.save(p);
        auditService.log("CREATE_PERMISSION", "RBAC_PERMISSION", key, Map.of("description", description));
        return saved;
    }

    @Transactional(readOnly = true)
    public List<RbacRole> listRoles() {
        return roleRepository.findAll();
    }

    @Transactional
    public RbacRole createRole(String name, String description) {
        RbacRole role = new RbacRole();
        role.setName(name);
        role.setDescription(description);
        RbacRole saved = roleRepository.save(role);
        auditService.log("CREATE_ROLE", "RBAC_ROLE", String.valueOf(saved.getId()), Map.of("name", name));
        return saved;
    }

    @Transactional
    public void deleteRole(Long roleId) {
        roleRepository.deleteById(roleId);
        auditService.log("DELETE_ROLE", "RBAC_ROLE", String.valueOf(roleId), null);
    }

    @Transactional
    public RbacRole setRolePermissions(Long roleId, List<String> permissionKeys) {
        RbacRole role = roleRepository.findById(roleId).orElseThrow(() -> new IllegalArgumentException("Role not found"));
        List<RbacPermission> perms = permissionRepository.findAllById(permissionKeys);
        role.setPermissions(new HashSet<>(perms));
        RbacRole saved = roleRepository.save(role);
        auditService.log("SET_ROLE_PERMISSIONS", "RBAC_ROLE", String.valueOf(roleId), Map.of("permissions", permissionKeys));
        return saved;
    }

    @Transactional
    public void assignRoleToUser(Long userId, Long roleId) {
        RbacRole role = roleRepository.findById(roleId).orElseThrow(() -> new IllegalArgumentException("Role not found"));
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        Set<User> users = role.getUsers();
        if (users == null) users = new HashSet<>();
        users.add(user);
        role.setUsers(users);
        roleRepository.save(role);
        auditService.log("ASSIGN_ROLE_TO_USER", "RBAC_ROLE", String.valueOf(roleId), Map.of("userId", userId));
    }

    @Transactional
    public void removeRoleFromUser(Long userId, Long roleId) {
        RbacRole role = roleRepository.findById(roleId).orElseThrow(() -> new IllegalArgumentException("Role not found"));
        Set<User> users = role.getUsers();
        if (users != null) {
            users.removeIf(u -> userId.equals(u.getId()));
            role.setUsers(users);
            roleRepository.save(role);
        }
        auditService.log("REMOVE_ROLE_FROM_USER", "RBAC_ROLE", String.valueOf(roleId), Map.of("userId", userId));
    }

    @Transactional
    public RbacRole updateRole(Long roleId, String name, String description) {
        RbacRole role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role not found"));

        boolean changed = false;
        if (name != null && !name.isBlank() && !name.equals(role.getName())) {
            role.setName(name);
            changed = true;
        }
        if (description != null && !description.equals(role.getDescription())) {
            role.setDescription(description);
            changed = true;
        }

        if (changed) {
            RbacRole saved = roleRepository.save(role);
            auditService.log("UPDATE_ROLE", "RBAC_ROLE", String.valueOf(roleId), Map.of(
                    "name", name,
                    "description", description
            ));
            return saved;
        }
        return role;
    }
}
