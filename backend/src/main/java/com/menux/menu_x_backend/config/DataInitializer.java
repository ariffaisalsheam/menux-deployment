package com.menux.menu_x_backend.config;

import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Create a test restaurant owner if it doesn't exist
        if (!userRepository.existsByUsername("testowner")) {
            User testUser = new User();
            testUser.setUsername("testowner");
            testUser.setEmail("test@example.com");
            testUser.setPassword(passwordEncoder.encode("password123"));
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
            testRestaurant.setOwner(testUser);
            
            restaurantRepository.save(testRestaurant);
            
            System.out.println("Test data initialized:");
            System.out.println("Username: testowner");
            System.out.println("Password: password123");
            System.out.println("Restaurant: Test Restaurant");
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

            userRepository.save(adminUser);

            System.out.println("Super Admin created:");
            System.out.println("Username: admin");
            System.out.println("Password: admin123");
        }
    }
}
