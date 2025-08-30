package com.menux.menu_x_backend.config;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.repository.UserRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.menux.menu_x_backend.repository.rbac.RbacRoleRepository rbacRoleRepository;

    @Override
    public void run(String... args) throws Exception {
        // Create a test restaurant owner if it doesn't exist
        if (!userRepository.existsByUsername("testowner")) {
            User testUser = new User();
            testUser.setUsername("testowner");
            testUser.setEmail("test@example.com");
            testUser.setPassword(passwordEncoder.encode("12345678"));
            testUser.setFullName("Test Restaurant Owner");
            testUser.setPhoneNumber("+8801234567890");
            testUser.setRole(User.Role.RESTAURANT_OWNER);

            testUser = userRepository.save(testUser);

            // Create a test restaurant
            Restaurant testRestaurant = new Restaurant();
            testRestaurant.setName("Test Restaurant");
            testRestaurant.setAddress("123 Test Street, Dhaka, Bangladesh");
            testRestaurant.setDescription("A test restaurant for Menu.X");
            testRestaurant.setPhoneNumber("+8801234567890");
            testRestaurant.setEmail("restaurant@test.com");
            // Owner relationship is managed by owner_id foreign key in database

            testRestaurant = restaurantRepository.save(testRestaurant);
            // Ensure owner_id FK is set to avoid any ORM relationship pitfalls
            restaurantRepository.updateOwnerIdNative(testRestaurant.getId(), testUser.getId());

            logger.info("Test data initialized:");
            logger.info("Username: testowner");
            logger.info("Password: 12345678");
            logger.info("Restaurant: Test Restaurant");
        } else {
            // Check if existing testowner user has a restaurant
            Optional<User> testUserOpt = userRepository.findByUsername("testowner");
            if (testUserOpt.isPresent()) {
                User testUser = testUserOpt.get();
                Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerId(testUser.getId());

                if (restaurantOpt.isEmpty() && testUser.getRole() == User.Role.RESTAURANT_OWNER) {
                    // Create a restaurant for the existing user
                    Restaurant testRestaurant = new Restaurant();
                    testRestaurant.setName("Testing");
                    testRestaurant.setAddress("123 Test Street, Dhaka, Bangladesh");
                    testRestaurant.setDescription("A test restaurant for Menu.X");
                    testRestaurant.setPhoneNumber("+8801234567890");
                    testRestaurant.setEmail("restaurant@test.com");
                    // Owner relationship is managed by owner_id foreign key in database
                    testRestaurant.setSubscriptionPlan(Restaurant.SubscriptionPlan.PRO);

                    testRestaurant = restaurantRepository.save(testRestaurant);
                    restaurantRepository.updateOwnerIdNative(testRestaurant.getId(), testUser.getId());

                    logger.info("Restaurant created for existing testowner user:");
                    logger.info("Restaurant: Testing");
                    logger.info("Subscription: PRO");
                }
            }
        }

        // Create a test super admin if it doesn't exist
        if (!userRepository.existsByUsername("admin")) {
            User adminUser = new User();
            adminUser.setUsername("admin");
            adminUser.setEmail("admin@menux.com");
            adminUser.setPassword(passwordEncoder.encode("admin123"));
            adminUser.setFullName("Super Admin");
            adminUser.setPhoneNumber("+8801234567891");
            adminUser.setRole(User.Role.SUPER_ADMIN);

            adminUser = userRepository.save(adminUser);

            // Assign SUPER_ADMIN_RBAC role to give the user actual permissions
            try {
                java.util.Optional<com.menux.menu_x_backend.entity.rbac.RbacRole> superAdminRole =
                    rbacRoleRepository.findByName("SUPER_ADMIN_RBAC");

                if (superAdminRole.isPresent()) {
                    com.menux.menu_x_backend.entity.rbac.RbacRole role = superAdminRole.get();
                    java.util.Set<User> users = role.getUsers();
                    if (users == null) users = new java.util.HashSet<>();
                    users.add(adminUser);
                    role.setUsers(users);
                    rbacRoleRepository.save(role);

                    logger.info("Assigned SUPER_ADMIN_RBAC role to admin user");
                } else {
                    logger.warn("SUPER_ADMIN_RBAC role not found - admin user will not have RBAC permissions");
                }
            } catch (Exception e) {
                logger.error("Failed to assign SUPER_ADMIN_RBAC role to admin user: " + e.getMessage());
            }

            logger.info("Super Admin created:");
            logger.info("Username: admin");
            logger.info("Password: admin123");
        }
    }
}
