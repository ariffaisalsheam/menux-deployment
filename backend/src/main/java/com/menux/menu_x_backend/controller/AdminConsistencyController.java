package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
@RequestMapping("/api/admin/consistency")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminConsistencyController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @GetMapping("/report")
    public ResponseEntity<Map<String, Object>> report() {
        Map<String, Object> report = new HashMap<>();
        List<User> owners = userRepository.findByRole(User.Role.RESTAURANT_OWNER);
        List<Long> ownerIds = owners.stream().map(User::getId).toList();

        List<Long> ownersWithRestaurant = new ArrayList<>();
        List<Long> ownersWithoutRestaurant = new ArrayList<>();

        for (Long ownerId : ownerIds) {
            if (restaurantRepository.findByOwnerId(ownerId).isPresent()) {
                ownersWithRestaurant.add(ownerId);
            } else {
                ownersWithoutRestaurant.add(ownerId);
            }
        }

        report.put("totalOwners", owners.size());
        report.put("ownersWithRestaurant", ownersWithRestaurant.size());
        report.put("ownersWithoutRestaurant", ownersWithoutRestaurant.size());
        report.put("missingOwnerIds", ownersWithoutRestaurant);
        return ResponseEntity.ok(report);
    }

    @PostMapping("/repair-missing")
    public ResponseEntity<Map<String, Object>> repairMissing() {
        Map<String, Object> result = new HashMap<>();
        int created = 0;
        for (User owner : userRepository.findByRole(User.Role.RESTAURANT_OWNER)) {
            Optional<Restaurant> r = restaurantRepository.findByOwnerId(owner.getId());
            if (r.isEmpty()) {
                Restaurant restaurant = new Restaurant();
                restaurant.setName(owner.getFullName() + "'s Restaurant");
                restaurant.setAddress("Unknown Address");
                restaurant.setIsActive(true);
                restaurant = restaurantRepository.save(restaurant);
                restaurantRepository.updateOwnerIdNative(restaurant.getId(), owner.getId());
                created++;
            }
        }
        result.put("created", created);
        return ResponseEntity.ok(result);
    }
}



