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
import java.util.Optional;
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
                .map(user -> {
                    if (user.getRole() == User.Role.RESTAURANT_OWNER) {
                        Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerId(user.getId());
                        return new UserManagementDTO(user, restaurantOpt.orElse(null));
                    } else {
                        return new UserManagementDTO(user);
                    }
                })
                .collect(Collectors.toList());
    }

    public UserManagementDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        if (user.getRole() == User.Role.RESTAURANT_OWNER) {
            Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerId(user.getId());
            return new UserManagementDTO(user, restaurantOpt.orElse(null));
        } else {
            return new UserManagementDTO(user);
        }
    }

    @Transactional
    public UserManagementDTO updateUserPlan(Long userId, Restaurant.SubscriptionPlan plan) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        if (user.getRole() != User.Role.RESTAURANT_OWNER) {
            throw new RuntimeException("Can only update subscription plan for restaurant owners");
        }
        
        Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerId(user.getId());
        if (restaurantOpt.isEmpty()) {
            throw new RuntimeException("User does not have an associated restaurant");
        }

        Restaurant restaurant = restaurantOpt.get();
        
        restaurant.setSubscriptionPlan(plan);
        restaurantRepository.save(restaurant);

        return new UserManagementDTO(user, restaurant);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        // If user has a restaurant, delete it first
        Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerId(user.getId());
        if (restaurantOpt.isPresent()) {
            restaurantRepository.delete(restaurantOpt.get());
        }
        
        userRepository.delete(user);
    }

    public UserManagementDTO activateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // In a real implementation, you would have an 'active' field in the User entity
        // For now, we'll just return the user as is
        if (user.getRole() == User.Role.RESTAURANT_OWNER) {
            Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerId(user.getId());
            return new UserManagementDTO(user, restaurantOpt.orElse(null));
        } else {
            return new UserManagementDTO(user);
        }
    }

    public UserManagementDTO deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // In a real implementation, you would have an 'active' field in the User entity
        // For now, we'll just return the user as is
        if (user.getRole() == User.Role.RESTAURANT_OWNER) {
            Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerId(user.getId());
            return new UserManagementDTO(user, restaurantOpt.orElse(null));
        } else {
            return new UserManagementDTO(user);
        }
    }

    // Restaurant Management Methods
    public List<RestaurantManagementDTO> getAllRestaurants() {
        List<Restaurant> restaurants = restaurantRepository.findAll();
        return restaurants.stream()
                .map(restaurant -> {
                    // Create basic DTO without owner data to avoid lazy loading
                    RestaurantManagementDTO dto = new RestaurantManagementDTO(restaurant);

                    // Try to find owner by restaurant ID using safe repository method
                    List<User> restaurantOwners = userRepository.findByRole(User.Role.RESTAURANT_OWNER);
                    for (User owner : restaurantOwners) {
                        Optional<Restaurant> ownerRestaurant = restaurantRepository.findByOwnerId(owner.getId());
                        if (ownerRestaurant.isPresent() && ownerRestaurant.get().getId().equals(restaurant.getId())) {
                            dto.setOwnerName(owner.getFullName());
                            dto.setOwnerEmail(owner.getEmail());
                            break;
                        }
                    }

                    return dto;
                })
                .collect(Collectors.toList());
    }

    public RestaurantManagementDTO getRestaurantById(Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Restaurant not found with id: " + id));

        // Create basic DTO without owner data to avoid lazy loading
        RestaurantManagementDTO dto = new RestaurantManagementDTO(restaurant);

        // Try to find owner by restaurant ID using safe repository method
        List<User> restaurantOwners = userRepository.findByRole(User.Role.RESTAURANT_OWNER);
        for (User owner : restaurantOwners) {
            Optional<Restaurant> ownerRestaurant = restaurantRepository.findByOwnerId(owner.getId());
            if (ownerRestaurant.isPresent() && ownerRestaurant.get().getId().equals(restaurant.getId())) {
                dto.setOwnerName(owner.getFullName());
                dto.setOwnerEmail(owner.getEmail());
                break;
            }
        }

        return dto;
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
