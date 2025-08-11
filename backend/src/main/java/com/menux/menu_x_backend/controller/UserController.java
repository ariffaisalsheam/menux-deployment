package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.dto.auth.UserProfileDTO;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.repository.UserRepository;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileDTO> getCurrentUserProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        User user = userOpt.get();
        UserProfileDTO profile = new UserProfileDTO();
        profile.setId(user.getId());
        profile.setUsername(user.getUsername());
        profile.setEmail(user.getEmail());
        profile.setFullName(user.getFullName());
        profile.setPhoneNumber(user.getPhoneNumber());
        profile.setRole(user.getRole().toString());
        
        // If user is a restaurant owner, get restaurant info and subscription plan
        if (user.getRole() == User.Role.RESTAURANT_OWNER) {
            Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerId(user.getId());
            if (restaurantOpt.isPresent()) {
                Restaurant restaurant = restaurantOpt.get();
                profile.setRestaurantId(restaurant.getId());
                profile.setRestaurantName(restaurant.getName());
                profile.setSubscriptionPlan(restaurant.getSubscriptionPlan().toString());
            }
        }
        
        return ResponseEntity.ok(profile);
    }
}
