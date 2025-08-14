package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.exception.RestaurantNotFoundException;
import com.menux.menu_x_backend.service.RestaurantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/restaurant")
@PreAuthorize("hasRole('RESTAURANT_OWNER')")
public class RestaurantController {

    @Autowired
    private RestaurantService restaurantService;

    @GetMapping("/current")
    public ResponseEntity<Restaurant> getCurrentRestaurant() {
        Optional<Restaurant> restaurantOpt = restaurantService.getCurrentUserRestaurant();

        if (restaurantOpt.isEmpty()) {
            throw new RestaurantNotFoundException("No restaurant found for current user");
        }

        return ResponseEntity.ok(restaurantOpt.get());
    }

    @PutMapping("/current")
    public ResponseEntity<Restaurant> updateCurrentRestaurant(@RequestBody Restaurant restaurantUpdate) {
        Optional<Restaurant> restaurantOpt = restaurantService.getCurrentUserRestaurant();

        if (restaurantOpt.isEmpty()) {
            throw new RestaurantNotFoundException("No restaurant found for current user");
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

        Optional<Restaurant> updatedRestaurantOpt = restaurantService.updateRestaurant(restaurant);
        if (updatedRestaurantOpt.isEmpty()) {
            throw new RuntimeException("Failed to update restaurant");
        }

        return ResponseEntity.ok(updatedRestaurantOpt.get());
    }
}
