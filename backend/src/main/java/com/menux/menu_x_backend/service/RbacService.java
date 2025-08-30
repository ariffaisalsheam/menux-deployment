package com.menux.menu_x_backend.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.menux.menu_x_backend.entity.rbac.RbacPermission;
import com.menux.menu_x_backend.entity.rbac.RbacRole;
import com.menux.menu_x_backend.repository.rbac.RbacRoleRepository;

@Service
public class RbacService {

    @Autowired
    private RbacRoleRepository roleRepository;

    @Transactional(readOnly = true)
    public Set<GrantedAuthority> getUserPermissionAuthorities(Long userId) {
        Set<GrantedAuthority> authorities = new HashSet<>();
        if (userId == null) return authorities;
        List<RbacRole> roles = roleRepository.findByUsers_Id(userId);
        for (RbacRole role : roles) {
            for (RbacPermission perm : role.getPermissions()) {
                if (perm != null && perm.getKey() != null) {
                    authorities.add(new SimpleGrantedAuthority("PERM_" + perm.getKey()));
                }
            }
        }
        return authorities;
    }
}
