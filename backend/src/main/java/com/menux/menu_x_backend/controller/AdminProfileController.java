package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.dto.profile.*;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.repository.UserRepository;
import com.menux.menu_x_backend.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/profile")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileService profileService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User requireCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        Optional<User> userOpt = userRepository.findByUsername(auth.getName());
        return userOpt.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @GetMapping
    public ResponseEntity<AdminProfileResponse> getProfile() {
        User user = requireCurrentUser();
        return ResponseEntity.ok(profileService.buildAdminProfile(user));
    }

    @PutMapping
    public ResponseEntity<AdminProfileResponse> updateProfile(@RequestBody @Valid AdminProfileUpdateRequest req) {
        User user = requireCurrentUser();
        return ResponseEntity.ok(profileService.updateAdminProfile(user, req));
    }

    @PutMapping("/password")
    public ResponseEntity<Void> updatePassword(@RequestBody @Valid UpdatePasswordRequest req) {
        User user = requireCurrentUser();
        try {
            profileService.updatePassword(user, req, passwordEncoder);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @PutMapping("/photo")
    public ResponseEntity<AdminProfileResponse> setPhoto(@RequestBody @Valid SetProfilePhotoRequest req) {
        User user = requireCurrentUser();
        return ResponseEntity.ok(profileService.setProfilePhoto(user, req.path, AdminProfileResponse.class));
    }
}
