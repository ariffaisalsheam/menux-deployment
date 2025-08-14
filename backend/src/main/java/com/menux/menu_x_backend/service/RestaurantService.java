package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.menux.menu_x_backend.security.RestaurantContext;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Service for safe restaurant data access without triggering lazy loading issues
 */
@Service
public class RestaurantService {

    private static final Logger logger = LoggerFactory.getLogger(RestaurantService.class);

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Safely get restaurant by owner ID without triggering lazy loading
     */
    public Optional<Restaurant> getRestaurantByOwnerId(Long ownerId) {
        try {
            long start = System.currentTimeMillis();
            Optional<Restaurant> result = restaurantRepository.findByOwnerId(ownerId);
            long took = System.currentTimeMillis() - start;
            if (took > 1000) {
                logger.warn("Slow restaurant lookup by ownerId {} took {} ms", ownerId, took);
            }
            return result;
        } catch (Exception e) {
            logger.error("Error fetching restaurant for owner ID: {}", ownerId, e);
            return Optional.empty();
        }
    }

    /**
     * Get current user's restaurant safely
     */
    public Optional<Restaurant> getCurrentUserRestaurant() {
        try {
            // Prefer restaurantId from JWT to avoid extra DB lookups
            Long restaurantIdFromToken = RestaurantContext.getRestaurantId();
            if (restaurantIdFromToken != null) {
                return getRestaurantById(restaurantIdFromToken);
            }

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getName() == null) {
                return Optional.empty();
            }

            String username = auth.getName();
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                logger.warn("User not found: {}", username);
                return Optional.empty();
            }

            User user = userOpt.get();
            if (user.getRole() != User.Role.RESTAURANT_OWNER) {
                logger.debug("User {} is not a restaurant owner", username);
                return Optional.empty();
            }

            return getRestaurantByOwnerId(user.getId());
        } catch (Exception e) {
            logger.error("Error getting current user's restaurant", e);
            return Optional.empty();
        }
    }

    /**
     * Get current user's restaurant ID safely
     */
    public Optional<Long> getCurrentUserRestaurantId() {
        Long restaurantIdFromToken = RestaurantContext.getRestaurantId();
        if (restaurantIdFromToken != null) {
            return Optional.of(restaurantIdFromToken);
        }
        return getCurrentUserRestaurant().map(Restaurant::getId);
    }

    /**
     * Check if current user has a restaurant
     */
    public boolean currentUserHasRestaurant() {
        return getCurrentUserRestaurant().isPresent();
    }

    /**
     * Get restaurant by ID with error handling
     */
    public Optional<Restaurant> getRestaurantById(Long restaurantId) {
        try {
            return restaurantRepository.findById(restaurantId);
        } catch (Exception e) {
            logger.error("Error fetching restaurant by ID: {}", restaurantId, e);
            return Optional.empty();
        }
    }

    /**
     * Check if user owns a specific restaurant
     */
    public boolean userOwnsRestaurant(Long userId, Long restaurantId) {
        try {
            // Use repository method to check ownership without triggering lazy loading
            Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerId(userId);
            return restaurantOpt.isPresent() && restaurantOpt.get().getId().equals(restaurantId);
        } catch (Exception e) {
            logger.error("Error checking restaurant ownership for user {} and restaurant {}", userId, restaurantId, e);
            return false;
        }
    }

    /**
     * Get restaurant name safely
     */
    public String getRestaurantName(Long restaurantId) {
        return getRestaurantById(restaurantId)
                .map(Restaurant::getName)
                .orElse(null);
    }

    /**
     * Get restaurant subscription plan safely
     */
    public Restaurant.SubscriptionPlan getRestaurantSubscriptionPlan(Long restaurantId) {
        return getRestaurantById(restaurantId)
                .map(Restaurant::getSubscriptionPlan)
                .orElse(Restaurant.SubscriptionPlan.BASIC);
    }

    /**
     * Check if restaurant has Pro subscription
     */
    public boolean isRestaurantPro(Long restaurantId) {
        return getRestaurantSubscriptionPlan(restaurantId) == Restaurant.SubscriptionPlan.PRO;
    }

    /**
     * Update restaurant safely
     */
    public Optional<Restaurant> updateRestaurant(Restaurant restaurant) {
        try {
            return Optional.of(restaurantRepository.save(restaurant));
        } catch (Exception e) {
            logger.error("Error updating restaurant: {}", restaurant.getId(), e);
            return Optional.empty();
        }
    }

    /**
     * Create restaurant safely
     */
    public Optional<Restaurant> createRestaurant(Restaurant restaurant) {
        try {
            return Optional.of(restaurantRepository.save(restaurant));
        } catch (Exception e) {
            logger.error("Error creating restaurant", e);
            return Optional.empty();
        }
    }
}
