package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RbacService rbacService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        // Enrich with RBAC permission authorities while keeping principal as User
        user.setExtraAuthorities(rbacService.getUserPermissionAuthorities(user.getId()));
        
        return user;
    }
}
