package com.menux.menu_x_backend.integration;

import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.repository.UserRepository;
import com.menux.menu_x_backend.service.RestaurantService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test to verify that the infinite loop regression is fixed
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class InfiniteLoopRegressionTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private RestaurantService restaurantService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;
    private Restaurant testRestaurant;

    @BeforeEach
    void setUp() {
        // Create a test user
        testUser = new User();
        testUser.setUsername("testowner_regression");
        testUser.setEmail("regression@test.com");
        testUser.setFullName("Regression Test Owner");
        testUser.setPassword(passwordEncoder.encode("password123"));
        testUser.setRole(User.Role.RESTAURANT_OWNER);
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());
        testUser = userRepository.save(testUser);

        // Create a test restaurant
        testRestaurant = new Restaurant();
        testRestaurant.setName("Regression Test Restaurant");
        testRestaurant.setAddress("123 Test Street");
        testRestaurant.setDescription("A test restaurant for regression testing");
        testRestaurant.setPhoneNumber("+8801234567890");
        testRestaurant.setEmail("restaurant@test.com");
        testRestaurant.setSubscriptionPlan(Restaurant.SubscriptionPlan.BASIC);
        testRestaurant.setCreatedAt(LocalDateTime.now());
        testRestaurant.setUpdatedAt(LocalDateTime.now());
        testRestaurant.setIsActive(true);
        
        // Save restaurant with owner_id foreign key
        testRestaurant = restaurantRepository.save(testRestaurant);
        
        // Manually set the owner_id in the database using native query
        restaurantRepository.flush();
        restaurantRepository.updateOwnerIdNative(testRestaurant.getId(), testUser.getId());
    }

    @Test
    void testNoInfiniteLoopWhenAccessingRestaurantByOwnerId() {
        // This test verifies that calling findByOwnerId doesn't cause infinite loops
        long startTime = System.currentTimeMillis();
        
        // Call the method that previously caused infinite loops
        Optional<Restaurant> result = restaurantService.getRestaurantByOwnerId(testUser.getId());
        
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        // Verify the result is correct
        assertTrue(result.isPresent());
        assertEquals("Regression Test Restaurant", result.get().getName());
        
        // Verify it completed quickly (should be under 1 second, not infinite)
        assertTrue(executionTime < 1000, 
            "Method took " + executionTime + "ms, which suggests an infinite loop or performance issue");
    }

    @Test
    void testMultipleCallsDoNotCauseInfiniteLoop() {
        // Test multiple rapid calls to ensure no infinite loop
        long startTime = System.currentTimeMillis();
        
        for (int i = 0; i < 10; i++) {
            Optional<Restaurant> result = restaurantService.getRestaurantByOwnerId(testUser.getId());
            assertTrue(result.isPresent());
            assertEquals("Regression Test Restaurant", result.get().getName());
        }
        
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        // 10 calls should complete very quickly
        assertTrue(executionTime < 2000, 
            "10 calls took " + executionTime + "ms, which suggests a performance issue");
    }

    @Test
    void testUserOwnsRestaurantDoesNotCauseInfiniteLoop() {
        // Test the userOwnsRestaurant method that was also problematic
        long startTime = System.currentTimeMillis();
        
        boolean owns = restaurantService.userOwnsRestaurant(testUser.getId(), testRestaurant.getId());
        
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        assertTrue(owns);
        assertTrue(executionTime < 1000, 
            "userOwnsRestaurant took " + executionTime + "ms, which suggests an infinite loop");
    }

    @Test
    void testUserWithoutRestaurantDoesNotCauseInfiniteLoop() {
        // Create a user without a restaurant
        User userWithoutRestaurant = new User();
        userWithoutRestaurant.setUsername("no_restaurant_user");
        userWithoutRestaurant.setEmail("norestaurant@test.com");
        userWithoutRestaurant.setFullName("No Restaurant User");
        userWithoutRestaurant.setPassword(passwordEncoder.encode("password123"));
        userWithoutRestaurant.setRole(User.Role.RESTAURANT_OWNER);
        userWithoutRestaurant.setCreatedAt(LocalDateTime.now());
        userWithoutRestaurant.setUpdatedAt(LocalDateTime.now());
        userWithoutRestaurant = userRepository.save(userWithoutRestaurant);

        long startTime = System.currentTimeMillis();
        
        // This should return empty without causing infinite loops
        Optional<Restaurant> result = restaurantService.getRestaurantByOwnerId(userWithoutRestaurant.getId());
        
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        assertFalse(result.isPresent());
        assertTrue(executionTime < 1000, 
            "Method took " + executionTime + "ms for user without restaurant, which suggests an issue");
    }

    @Test
    void testCurrentUserRestaurantMethodsDoNotCauseInfiniteLoop() {
        // Test the getCurrentUserRestaurant method (though it requires authentication context)
        long startTime = System.currentTimeMillis();
        
        // This will return empty since there's no authentication context, but shouldn't loop
        Optional<Restaurant> result = restaurantService.getCurrentUserRestaurant();
        
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        assertFalse(result.isPresent()); // Expected since no auth context
        assertTrue(executionTime < 1000, 
            "getCurrentUserRestaurant took " + executionTime + "ms, which suggests an issue");
    }
}
