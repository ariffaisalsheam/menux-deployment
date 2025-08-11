package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.dto.auth.AuthResponse;
import com.menux.menu_x_backend.dto.auth.LoginRequest;
import com.menux.menu_x_backend.dto.auth.RegisterRequest;
import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.repository.UserRepository;
import com.menux.menu_x_backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if username already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username is already taken!");
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already in use!");
        }

        // Create new user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(request.getRole());

        user = userRepository.save(user);

        // If user is a restaurant owner, create restaurant
        Restaurant restaurant = null;
        if (request.getRole() == User.Role.RESTAURANT_OWNER) {
            if (request.getRestaurantName() == null || request.getRestaurantName().trim().isEmpty()) {
                throw new RuntimeException("Restaurant name is required for restaurant owners");
            }
            if (request.getRestaurantAddress() == null || request.getRestaurantAddress().trim().isEmpty()) {
                throw new RuntimeException("Restaurant address is required for restaurant owners");
            }

            restaurant = new Restaurant();
            restaurant.setName(request.getRestaurantName());
            restaurant.setAddress(request.getRestaurantAddress());
            restaurant.setDescription(request.getRestaurantDescription());
            restaurant.setPhoneNumber(request.getRestaurantPhone());
            restaurant.setEmail(request.getRestaurantEmail());
            restaurant.setOwner(user);

            restaurant = restaurantRepository.save(restaurant);
        }

        // Generate JWT token
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", user.getRole().name());
        extraClaims.put("userId", user.getId());
        if (restaurant != null) {
            extraClaims.put("restaurantId", restaurant.getId());
        }

        String token = jwtUtil.generateToken(user, extraClaims);

        return new AuthResponse(
            token,
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFullName(),
            user.getRole(),
            restaurant != null ? restaurant.getId() : null,
            restaurant != null ? restaurant.getName() : null,
            restaurant != null ? restaurant.getSubscriptionPlan() : null
        );
    }

    public AuthResponse login(LoginRequest request) {
        // Authenticate user
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User user = (User) authentication.getPrincipal();

        // Generate JWT token
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", user.getRole().name());
        extraClaims.put("userId", user.getId());

        Long restaurantId = null;
        if (user.getRole() == User.Role.RESTAURANT_OWNER && user.getRestaurant() != null) {
            restaurantId = user.getRestaurant().getId();
            extraClaims.put("restaurantId", restaurantId);
        }

        String token = jwtUtil.generateToken(user, extraClaims);

        return new AuthResponse(
            token,
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFullName(),
            user.getRole(),
            restaurantId,
            user.getRestaurant() != null ? user.getRestaurant().getName() : null,
            user.getRestaurant() != null ? user.getRestaurant().getSubscriptionPlan() : null
        );
    }
}
