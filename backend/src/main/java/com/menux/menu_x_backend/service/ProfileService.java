package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.dto.profile.*;
import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.entity.UserProfile;
import com.menux.menu_x_backend.repository.UserProfileRepository;
import com.menux.menu_x_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class ProfileService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private RestaurantService restaurantService;

    public OwnerProfileResponse buildOwnerProfile(User user) {
        OwnerProfileResponse dto = new OwnerProfileResponse();
        dto.id = user.getId();
        dto.username = user.getUsername();
        dto.email = user.getEmail();
        dto.fullName = user.getFullName();
        dto.phoneNumber = user.getPhoneNumber();

        UserProfile up = userProfileRepository.findByUser(user).orElse(null);
        dto.photoPath = (up != null) ? up.getPhotoPath() : null;

        Optional<Restaurant> restOpt = restaurantService.getCurrentUserRestaurant();
        if (restOpt.isPresent()) {
            Restaurant r = restOpt.get();
            OwnerProfileResponse.RestaurantInfo ri = new OwnerProfileResponse.RestaurantInfo();
            ri.id = r.getId();
            ri.name = r.getName();
            ri.address = r.getAddress();
            ri.phoneNumber = r.getPhoneNumber();
            ri.email = r.getEmail();
            ri.subscriptionPlan = r.getSubscriptionPlan().name();
            dto.restaurant = ri;
        }
        return dto;
    }

    public AdminProfileResponse buildAdminProfile(User user) {
        AdminProfileResponse dto = new AdminProfileResponse();
        dto.id = user.getId();
        dto.username = user.getUsername();
        dto.email = user.getEmail();
        dto.fullName = user.getFullName();
        dto.phoneNumber = user.getPhoneNumber();
        UserProfile up = userProfileRepository.findByUser(user).orElse(null);
        dto.photoPath = (up != null) ? up.getPhotoPath() : null;
        dto.roles = new String[] { "ROLE_" + user.getRole().name() };
        return dto;
    }

    public OwnerProfileResponse updateOwnerProfile(User user, UpdateOwnerProfileRequest req) {
        if (req == null) return buildOwnerProfile(user);
        if (req.fullName != null && !req.fullName.isBlank()) user.setFullName(req.fullName.trim());
        if (req.phoneNumber != null && !req.phoneNumber.isBlank()) user.setPhoneNumber(req.phoneNumber.trim());
        if (req.email != null && !req.email.isBlank()) {
            String newEmail = req.email.trim();
            // Only check uniqueness if different from current email
            if (user.getEmail() == null || !newEmail.equalsIgnoreCase(user.getEmail())) {
                if (userRepository.existsByEmail(newEmail)) {
                    // 409 Conflict with clear message for frontend UX
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already taken");
                }
            }
            user.setEmail(newEmail);
        }
        if (req.username != null && !req.username.isBlank()) {
            String desired = req.username.trim();
            if (!desired.equals(user.getUsername())) {
                if (!isValidUsername(desired)) {
                    throw new IllegalArgumentException("Invalid username. Use 3-50 chars: letters, digits, ., -, _");
                }
                if (userRepository.existsByUsername(desired)) {
                    throw new IllegalArgumentException("Username already taken");
                }
                user.setUsername(desired);
            }
        }
        userRepository.save(user);

        if (req.business != null) {
            restaurantService.getCurrentUserRestaurant().ifPresent(restaurant -> {
                if (req.business.name != null && !req.business.name.isBlank()) restaurant.setName(req.business.name.trim());
                if (req.business.address != null) restaurant.setAddress(req.business.address.trim());
                if (req.business.phoneNumber != null) restaurant.setPhoneNumber(req.business.phoneNumber.trim());
                if (req.business.email != null) restaurant.setEmail(req.business.email.trim());
                if (req.business.description != null) restaurant.setDescription(req.business.description.trim());
                restaurantService.updateRestaurant(restaurant);
            });
        }
        return buildOwnerProfile(user);
    }

    public AdminProfileResponse updateAdminProfile(User user, AdminProfileUpdateRequest req) {
        if (req == null) return buildAdminProfile(user);
        if (req.fullName != null && !req.fullName.isBlank()) user.setFullName(req.fullName.trim());
        if (req.phoneNumber != null) user.setPhoneNumber(req.phoneNumber.trim());
        if (req.email != null && !req.email.isBlank()) user.setEmail(req.email.trim());
        userRepository.save(user);
        return buildAdminProfile(user);
    }

    public void updatePassword(User user, UpdatePasswordRequest req, PasswordEncoder encoder) {
        if (req == null) throw new IllegalArgumentException("Invalid request");
        if (!encoder.matches(req.currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        user.setPassword(encoder.encode(req.newPassword));
        userRepository.save(user);
    }

    public <T> T setProfilePhoto(User user, String path, Class<T> responseType) {
        UserProfile up = userProfileRepository.findByUser(user).orElseGet(() -> {
            UserProfile created = new UserProfile();
            created.setUser(user);
            return created;
        });
        up.setPhotoPath(path);
        userProfileRepository.save(up);

        if (responseType.equals(OwnerProfileResponse.class)) {
            return responseType.cast(buildOwnerProfile(user));
        }
        if (responseType.equals(AdminProfileResponse.class)) {
            return responseType.cast(buildAdminProfile(user));
        }
        return null;
    }

    // --- Username helpers & availability ---
    private boolean isValidUsername(String s) {
        if (s == null) return false;
        String trimmed = s.trim();
        if (trimmed.length() < 3 || trimmed.length() > 50) return false;
        return trimmed.matches("[A-Za-z0-9._-]+");
    }

    public UsernameAvailabilityResponse checkUsernameAvailability(User user, String desired) {
        UsernameAvailabilityResponse resp = new UsernameAvailabilityResponse();
        String uname = desired == null ? "" : desired.trim();
        resp.username = uname;
        if (!isValidUsername(uname)) {
            resp.available = false;
            resp.suggestions = generateSuggestions(uname);
            return resp;
        }
        if (uname.equalsIgnoreCase(user.getUsername())) {
            resp.available = true; // current username is effectively available for this user
            resp.suggestions = new String[]{};
            return resp;
        }
        boolean taken = userRepository.existsByUsername(uname);
        resp.available = !taken;
        resp.suggestions = taken ? generateSuggestions(uname) : new String[]{};
        return resp;
    }

    private String[] generateSuggestions(String base) {
        String seed = (base == null || base.isBlank()) ? "user" : base.replaceAll("[^A-Za-z0-9._-]", "");
        List<String> out = new ArrayList<>();
        int attempts = 0;
        while (out.size() < 3 && attempts < 20) {
            attempts++;
            int rand = ThreadLocalRandom.current().nextInt(10, 9999);
            String cand = seed + rand;
            if (!userRepository.existsByUsername(cand) && isValidUsername(cand) && !out.contains(cand)) {
                out.add(cand);
            }
        }
        return out.toArray(new String[0]);
    }
}
