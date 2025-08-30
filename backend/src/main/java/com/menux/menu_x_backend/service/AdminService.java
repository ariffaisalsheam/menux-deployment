package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.dto.admin.UserManagementDTO;
import com.menux.menu_x_backend.dto.admin.RestaurantManagementDTO;
import com.menux.menu_x_backend.dto.admin.PlatformAnalyticsDTO;
import com.menux.menu_x_backend.dto.admin.UpdateUserRequest;
import com.menux.menu_x_backend.dto.auth.AuthResponse;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.rbac.RbacRole;
import com.menux.menu_x_backend.repository.UserRepository;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.repository.rbac.RbacRoleRepository;
import com.menux.menu_x_backend.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;

@Service
public class AdminService {

    private static final Logger logger = LoggerFactory.getLogger(AdminService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private RbacRoleRepository rbacRoleRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private RbacService rbacService;

    @Autowired
    private AuditService auditService;

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

    // Get only restaurant owners for user management
    public List<UserManagementDTO> getRestaurantOwners() {
        List<User> users = userRepository.findByRole(User.Role.RESTAURANT_OWNER);
        return users.stream()
                .map(user -> {
                    Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerId(user.getId());
                    return new UserManagementDTO(user, restaurantOpt.orElse(null));
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

        // Business validation checks
        validateUserDeletion(user);

        try {
            // Remove user from all RBAC roles first to avoid constraint violations
            removeUserFromAllRoles(userId);

            // If user has a restaurant, delete it first
            Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerId(user.getId());
            if (restaurantOpt.isPresent()) {
                Restaurant restaurant = restaurantOpt.get();
                logger.info("Deleting restaurant {} for user {}", restaurant.getName(), user.getUsername());
                restaurantRepository.delete(restaurant);
            }

            // Delete the user
            logger.info("Deleting user: {}", user.getUsername());
            userRepository.delete(user);

            // Audit log
            auditService.log("DELETE_USER", "USER", userId.toString(),
                Map.of("username", user.getUsername(), "role", user.getRole().toString()));

        } catch (Exception e) {
            logger.error("Failed to delete user with id: " + userId, e);
            throw new RuntimeException("Failed to delete user: " + e.getMessage(), e);
        }
    }

    private void validateUserDeletion(User user) {
        // Check if trying to delete a SUPER_ADMIN user (should use AdminUserService instead)
        if (user.getRole() == User.Role.SUPER_ADMIN) {
            throw new RuntimeException("Cannot delete admin users through this endpoint. Use admin user management instead.");
        }

        // Check if user is currently logged in (prevent self-deletion)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName().equals(user.getUsername())) {
            throw new RuntimeException("Cannot delete your own account through admin interface");
        }

        // Additional business rules can be added here
        logger.info("User deletion validation passed for user: {}", user.getUsername());
    }

    @Transactional
    public void removeUserFromAllRoles(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        List<RbacRole> userRoles = rbacRoleRepository.findByUsers_Id(userId);
        for (RbacRole role : userRoles) {
            role.getUsers().remove(user);
            rbacRoleRepository.save(role);
        }
        logger.info("Removed user {} from {} RBAC roles", user.getUsername(), userRoles.size());
    }

    @Transactional
    public UserManagementDTO updateUser(Long userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Update basic user info
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmailAndIdNot(request.getEmail(), userId)) {
                throw new RuntimeException("Email already exists");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }

        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }

        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }

        User savedUser = userRepository.save(user);

        // Return DTO with restaurant info if applicable
        if (user.getRole() == User.Role.RESTAURANT_OWNER) {
            Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerId(user.getId());
            return new UserManagementDTO(savedUser, restaurantOpt.orElse(null));
        } else {
            return new UserManagementDTO(savedUser);
        }
    }

    @Transactional
    public UserManagementDTO activateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        user.setIsActive(true);
        User savedUser = userRepository.save(user);

        if (user.getRole() == User.Role.RESTAURANT_OWNER) {
            Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerId(user.getId());
            return new UserManagementDTO(savedUser, restaurantOpt.orElse(null));
        } else {
            return new UserManagementDTO(savedUser);
        }
    }

    @Transactional
    public UserManagementDTO deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        user.setIsActive(false);
        User savedUser = userRepository.save(user);

        if (user.getRole() == User.Role.RESTAURANT_OWNER) {
            Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerId(user.getId());
            return new UserManagementDTO(savedUser, restaurantOpt.orElse(null));
        } else {
            return new UserManagementDTO(savedUser);
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
        // Count only restaurant owners (exclude SUPER_ADMIN users from public metrics)
        Long totalUsers = userRepository.countByRole(User.Role.RESTAURANT_OWNER);
        Long totalRestaurants = restaurantRepository.count();

        Long proSubscriptions = restaurantRepository.countBySubscriptionPlan(Restaurant.SubscriptionPlan.PRO);
        Long basicSubscriptions = restaurantRepository.countBySubscriptionPlan(Restaurant.SubscriptionPlan.BASIC);

        // Calculate monthly revenue (Pro subscriptions * 1500 BDT)
        Double monthlyRevenue = proSubscriptions * 1500.0;

        // Count only active restaurant owners (exclude SUPER_ADMIN users)
        Long activeUsers = userRepository.countActiveRestaurantOwners();
        
        // System health is always 99.8% for demo purposes
        Double systemHealth = 99.8;
        
        // Total orders would come from an Order entity (not implemented yet)
        Long totalOrders = 0L;
        
        // Conversion rate calculation (Pro / Total restaurants)
        Double conversionRate = totalRestaurants > 0 ? (proSubscriptions.doubleValue() / totalRestaurants.doubleValue()) * 100 : 0.0;
        
        // Calculate trend data (percentage changes from previous month)
        // For demo purposes, we'll simulate realistic growth patterns based on current data
        Double totalUsersChange = calculateTrendChange(totalUsers, "users");
        Double totalRestaurantsChange = calculateTrendChange(totalRestaurants, "restaurants");
        Double proSubscriptionsChange = calculateTrendChange(proSubscriptions, "pro_subscriptions");
        Double monthlyRevenueChange = calculateTrendChange(monthlyRevenue.longValue(), "revenue");
        Double activeUsersChange = calculateTrendChange(activeUsers, "active_users");
        
        return new PlatformAnalyticsDTO(
            totalUsers,
            totalRestaurants,
            proSubscriptions,
            basicSubscriptions,
            monthlyRevenue,
            activeUsers,
            systemHealth,
            totalOrders,
            conversionRate,
            totalUsersChange,
            totalRestaurantsChange,
            proSubscriptionsChange,
            monthlyRevenueChange,
            activeUsersChange
        );
    }
    
    private Double calculateTrendChange(Long currentValue, String metric) {
        // Simulate realistic growth patterns based on business metrics
        // In a real implementation, this would query historical data from the database
        if (currentValue == null || currentValue == 0) {
            return 0.0;
        }
        
        return switch (metric) {
            case "users" ->
                // User growth typically 8-15% monthly for growing platforms
                8.0 + (currentValue % 8); // 8-15% range
            case "restaurants" ->
                // Restaurant onboarding is slower but steady
                5.0 + (currentValue % 6); // 5-10% range
            case "pro_subscriptions" ->
                // Pro conversions show higher growth as platform matures
                12.0 + (currentValue % 8); // 12-19% range
            case "revenue" ->
                // Revenue growth follows pro subscription growth
                15.0 + (currentValue % 10); // 15-24% range
            case "active_users" ->
                // Active user growth is slightly lower than total users
                6.0 + (currentValue % 6); // 6-11% range
            default -> 0.0;
        };
    }

    @Transactional
    public AuthResponse switchToUser(Long userId) {
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Generate JWT token for the target user
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", targetUser.getRole().name());
        extraClaims.put("userId", targetUser.getId());

        Long restaurantId = null;
        String restaurantName = null;
        Restaurant.SubscriptionPlan subscriptionPlan = null;

        if (targetUser.getRole() == User.Role.RESTAURANT_OWNER) {
            Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerId(targetUser.getId());
            if (restaurantOpt.isPresent()) {
                Restaurant restaurant = restaurantOpt.get();
                restaurantId = restaurant.getId();
                restaurantName = restaurant.getName();
                subscriptionPlan = restaurant.getSubscriptionPlan();
                extraClaims.put("restaurantId", restaurantId);
            }
        }

        // Add RBAC permissions to JWT token
        var rbacPermissions = rbacService.getUserPermissionAuthorities(targetUser.getId());
        var permissionKeys = rbacPermissions.stream()
                .map(auth -> auth.getAuthority())
                .filter(perm -> perm.startsWith("PERM_")) // Only include RBAC permissions
                .map(perm -> perm.replace("PERM_", "")) // Remove PERM_ prefix
                .collect(java.util.stream.Collectors.toList());
        extraClaims.put("permissions", permissionKeys);

        String token = jwtUtil.generateToken(targetUser, extraClaims);

        return new AuthResponse(
            token,
            targetUser.getId(),
            targetUser.getUsername(),
            targetUser.getEmail(),
            targetUser.getFullName(),
            targetUser.getRole().name(),
            restaurantId,
            restaurantName,
            subscriptionPlan != null ? subscriptionPlan.name() : null
        );
    }
}
