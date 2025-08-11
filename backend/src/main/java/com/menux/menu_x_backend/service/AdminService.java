package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.dto.admin.UserManagementDTO;
import com.menux.menu_x_backend.dto.admin.RestaurantManagementDTO;
import com.menux.menu_x_backend.dto.admin.PlatformAnalyticsDTO;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.repository.UserRepository;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    // User Management Methods
    public List<UserManagementDTO> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users.stream()
                .map(UserManagementDTO::new)
                .collect(Collectors.toList());
    }

    public UserManagementDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return new UserManagementDTO(user);
    }

    @Transactional
    public UserManagementDTO updateUserPlan(Long userId, Restaurant.SubscriptionPlan plan) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        if (user.getRole() != User.Role.RESTAURANT_OWNER) {
            throw new RuntimeException("Can only update subscription plan for restaurant owners");
        }
        
        Restaurant restaurant = user.getRestaurant();
        if (restaurant == null) {
            throw new RuntimeException("User does not have an associated restaurant");
        }
        
        restaurant.setSubscriptionPlan(plan);
        restaurantRepository.save(restaurant);
        
        return new UserManagementDTO(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        // If user has a restaurant, delete it first
        if (user.getRestaurant() != null) {
            restaurantRepository.delete(user.getRestaurant());
        }
        
        userRepository.delete(user);
    }

    public UserManagementDTO activateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        // In a real implementation, you would have an 'active' field in the User entity
        // For now, we'll just return the user as is
        return new UserManagementDTO(user);
    }

    public UserManagementDTO deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        // In a real implementation, you would have an 'active' field in the User entity
        // For now, we'll just return the user as is
        return new UserManagementDTO(user);
    }

    // Restaurant Management Methods
    public List<RestaurantManagementDTO> getAllRestaurants() {
        List<Restaurant> restaurants = restaurantRepository.findAll();
        return restaurants.stream()
                .map(RestaurantManagementDTO::new)
                .collect(Collectors.toList());
    }

    public RestaurantManagementDTO getRestaurantById(Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Restaurant not found with id: " + id));
        return new RestaurantManagementDTO(restaurant);
    }

    // Platform Analytics Methods
    public PlatformAnalyticsDTO getPlatformAnalytics() {
        Long totalUsers = userRepository.count();
        Long totalRestaurants = restaurantRepository.count();
        
        Long proSubscriptions = restaurantRepository.countBySubscriptionPlan(Restaurant.SubscriptionPlan.PRO);
        Long basicSubscriptions = restaurantRepository.countBySubscriptionPlan(Restaurant.SubscriptionPlan.BASIC);
        
        // Calculate monthly revenue (Pro subscriptions * 1500 BDT)
        Double monthlyRevenue = proSubscriptions * 1500.0;
        
        // For now, assume all users are active (in a real app, you'd track last login)
        Long activeUsers = totalUsers;
        
        // System health is always 99.8% for demo purposes
        Double systemHealth = 99.8;
        
        // Total orders would come from an Order entity (not implemented yet)
        Long totalOrders = 0L;
        
        // Conversion rate calculation (Pro / Total restaurants)
        Double conversionRate = totalRestaurants > 0 ? (proSubscriptions.doubleValue() / totalRestaurants.doubleValue()) * 100 : 0.0;
        
        return new PlatformAnalyticsDTO(
            totalUsers,
            totalRestaurants,
            proSubscriptions,
            basicSubscriptions,
            monthlyRevenue,
            activeUsers,
            systemHealth,
            totalOrders,
            conversionRate
        );
    }
}
