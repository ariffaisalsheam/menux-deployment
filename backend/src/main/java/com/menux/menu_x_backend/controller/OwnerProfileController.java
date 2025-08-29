package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.dto.profile.OwnerProfileResponse;
import com.menux.menu_x_backend.dto.profile.UsernameAvailabilityResponse;
import com.menux.menu_x_backend.dto.profile.SetProfilePhotoRequest;
import com.menux.menu_x_backend.dto.profile.UpdateOwnerProfileRequest;
import com.menux.menu_x_backend.dto.profile.UpdatePasswordRequest;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.repository.UserRepository;
import com.menux.menu_x_backend.service.ProfileService;
import com.menux.menu_x_backend.service.AdminService;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.security.JwtUtil;
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
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/owner/profile")
@PreAuthorize("hasRole('RESTAURANT_OWNER')")
public class OwnerProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileService profileService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AdminService adminService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private RestaurantRepository restaurantRepository;

    private User requireCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        Optional<User> userOpt = userRepository.findByUsername(auth.getName());
        return userOpt.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @GetMapping
    public ResponseEntity<OwnerProfileResponse> getProfile() {
        User user = requireCurrentUser();
        if (user.getRole() != User.Role.RESTAURANT_OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a restaurant owner");
        }
        return ResponseEntity.ok(profileService.buildOwnerProfile(user));
    }

    @PutMapping
    public ResponseEntity<OwnerProfileResponse> updateProfile(@RequestBody @Valid UpdateOwnerProfileRequest req) {
        User user = requireCurrentUser();
        // Capture original username to detect changes
        String originalUsername = user.getUsername();

        // Perform update
        OwnerProfileResponse updated = profileService.updateOwnerProfile(user, req);

        boolean usernameChanged = req != null
                && req.username != null
                && !req.username.isBlank()
                && !req.username.trim().equals(originalUsername);

        ResponseEntity.BodyBuilder builder = ResponseEntity.ok();
        if (usernameChanged) {
            // Issue a fresh JWT only when username changed
            Map<String, Object> extraClaims = new HashMap<>();
            extraClaims.put("role", user.getRole().name());
            extraClaims.put("userId", user.getId());
            if (user.getRole() == User.Role.RESTAURANT_OWNER) {
                restaurantRepository.findByOwnerId(user.getId()).ifPresent(r -> {
                    extraClaims.put("restaurantId", r.getId());
                });
            }
            String token = jwtUtil.generateToken(user, extraClaims);
            builder.header("Authorization", "Bearer " + token);
        }

        return builder.body(updated);
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
    public ResponseEntity<OwnerProfileResponse> setPhoto(@RequestBody @Valid SetProfilePhotoRequest req) {
        User user = requireCurrentUser();
        return ResponseEntity.ok(profileService.setProfilePhoto(user, req.path, OwnerProfileResponse.class));
    }

    @GetMapping("/username-availability")
    public ResponseEntity<UsernameAvailabilityResponse> checkUsernameAvailability(@RequestParam("username") String username) {
        User user = requireCurrentUser();
        UsernameAvailabilityResponse resp = profileService.checkUsernameAvailability(user, username);
        return ResponseEntity.ok(resp);
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAccount() {
        User user = requireCurrentUser();
        if (user.getRole() != User.Role.RESTAURANT_OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a restaurant owner");
        }
        try {
            adminService.deleteUser(user.getId());
            return ResponseEntity.noContent().build();
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }
}
