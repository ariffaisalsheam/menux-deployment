package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/restaurant")
@PreAuthorize("hasRole('RESTAURANT_OWNER')")
public class RestaurantController {

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/current")
    public ResponseEntity<Restaurant> getCurrentRestaurant() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        User user = userOpt.get();
        Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerId(user.getId());
        
        if (restaurantOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(restaurantOpt.get());
    }

    @PutMapping("/current")
    public ResponseEntity<Restaurant> updateCurrentRestaurant(@RequestBody Restaurant restaurantUpdate) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        User user = userOpt.get();
        Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerId(user.getId());
        
        if (restaurantOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Restaurant restaurant = restaurantOpt.get();
        
        // Update fields
        if (restaurantUpdate.getName() != null) {
            restaurant.setName(restaurantUpdate.getName());
        }
        if (restaurantUpdate.getDescription() != null) {
            restaurant.setDescription(restaurantUpdate.getDescription());
        }
        if (restaurantUpdate.getAddress() != null) {
            restaurant.setAddress(restaurantUpdate.getAddress());
        }
        if (restaurantUpdate.getPhoneNumber() != null) {
            restaurant.setPhoneNumber(restaurantUpdate.getPhoneNumber());
        }
        if (restaurantUpdate.getEmail() != null) {
            restaurant.setEmail(restaurantUpdate.getEmail());
        }
        // Note: openingHours and cuisine fields are not implemented in the Restaurant entity yet
        
        Restaurant savedRestaurant = restaurantRepository.save(restaurant);
        return ResponseEntity.ok(savedRestaurant);
    }
}
