package com.menux.menu_x_backend.integration;

import com.menux.menu_x_backend.dto.order.OrderDTO;
import com.menux.menu_x_backend.entity.*;
import com.menux.menu_x_backend.repository.*;
import com.menux.menu_x_backend.service.OrderDTOService;
import com.menux.menu_x_backend.service.RestaurantService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test to verify ALL infinite loop issues are resolved
 * Tests restaurant profile, menu management, and order processing scenarios
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class CompleteInfiniteLoopFixTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private MenuRepository menuRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private RestaurantService restaurantService;

    @Autowired
    private OrderDTOService orderDTOService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;
    private Restaurant testRestaurant;
    private Menu testMenu;
    private MenuItem testMenuItem;
    private Order testOrder;
    private OrderItem testOrderItem;
    private Feedback testFeedback;

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = new User();
        testUser.setUsername("testowner_complete");
        testUser.setEmail("complete@test.com");
        testUser.setFullName("Complete Test Owner");
        testUser.setPassword(passwordEncoder.encode("password123"));
        testUser.setRole(User.Role.RESTAURANT_OWNER);
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());
        testUser = userRepository.save(testUser);

        // Create test restaurant
        testRestaurant = new Restaurant();
        testRestaurant.setName("Complete Test Restaurant");
        testRestaurant.setAddress("123 Complete Test Street");
        testRestaurant.setDescription("A complete test restaurant");
        testRestaurant.setPhoneNumber("+8801234567890");
        testRestaurant.setEmail("restaurant@complete.test");
        testRestaurant.setSubscriptionPlan(Restaurant.SubscriptionPlan.PRO);
        testRestaurant.setCreatedAt(LocalDateTime.now());
        testRestaurant.setUpdatedAt(LocalDateTime.now());
        testRestaurant.setIsActive(true);
        testRestaurant = restaurantRepository.save(testRestaurant);
        
        // Link restaurant to owner
        restaurantRepository.flush();
        restaurantRepository.updateOwnerIdNative(testRestaurant.getId(), testUser.getId());

        // Create test menu
        testMenu = new Menu();
        testMenu.setName("Test Menu");
        testMenu.setDescription("A test menu");
        testMenu.setRestaurant(testRestaurant);
        testMenu.setIsActive(true);
        testMenu.setCreatedAt(LocalDateTime.now());
        testMenu = menuRepository.save(testMenu);

        // Create test menu item
        testMenuItem = new MenuItem();
        testMenuItem.setName("Test Burger");
        testMenuItem.setDescription("A delicious test burger");
        testMenuItem.setAiDescription("An AI-generated description of a fantastic burger");
        testMenuItem.setPrice(new BigDecimal("15.99"));
        testMenuItem.setCategory(MenuItem.Category.MAIN_COURSE);
        testMenuItem.setMenu(testMenu);
        testMenuItem.setIsAvailable(true);
        testMenuItem.setCreatedAt(LocalDateTime.now());
        testMenuItem = menuItemRepository.save(testMenuItem);

        // Create test order
        testOrder = new Order();
        testOrder.setOrderNumber("TEST-ORDER-001");
        testOrder.setCustomerName("Test Customer");
        testOrder.setCustomerPhone("+8801234567891");
        testOrder.setTableNumber("T1");
        testOrder.setTotalAmount(new BigDecimal("15.99"));
        testOrder.setStatus(Order.OrderStatus.PENDING);
        testOrder.setPaymentStatus(Order.PaymentStatus.PENDING);
        testOrder.setRestaurant(testRestaurant);
        testOrder.setCreatedAt(LocalDateTime.now());
        testOrder = orderRepository.save(testOrder);

        // Create test order item
        testOrderItem = new OrderItem();
        testOrderItem.setOrder(testOrder);
        testOrderItem.setMenuItem(testMenuItem);
        testOrderItem.setQuantity(1);
        testOrderItem.setPrice(new BigDecimal("15.99"));
        testOrderItem.setCreatedAt(LocalDateTime.now());
        testOrderItem = orderItemRepository.save(testOrderItem);

        // Create test feedback
        testFeedback = new Feedback();
        testFeedback.setRestaurant(testRestaurant);
        testFeedback.setCustomerName("Test Customer");
        testFeedback.setCustomerEmail("customer@test.com");
        testFeedback.setRating(5);
        testFeedback.setComment("Great food and service!");
        testFeedback.setAiAnalysis("Positive feedback about food quality and service");
        testFeedback.setAiSentiment(Feedback.Sentiment.POSITIVE);
        testFeedback.setCreatedAt(LocalDateTime.now());
        testFeedback = feedbackRepository.save(testFeedback);
    }

    @Test
    void testRestaurantProfileAccessNoInfiniteLoop() {
        // Test accessing restaurant profile data without infinite loops
        long startTime = System.currentTimeMillis();
        
        // This simulates accessing restaurant profile page
        Optional<Restaurant> restaurantOpt = restaurantService.getRestaurantByOwnerId(testUser.getId());
        
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        assertTrue(restaurantOpt.isPresent());
        assertEquals("Complete Test Restaurant", restaurantOpt.get().getName());
        assertTrue(executionTime < 1000, 
            "Restaurant profile access took " + executionTime + "ms, suggesting infinite loop");
    }

    @Test
    void testMenuItemDisplayDescriptionNoInfiniteLoop() {
        // Test MenuItem.getDisplayDescription() method that was causing infinite loops
        long startTime = System.currentTimeMillis();
        
        // This method previously called menu.getRestaurant().isPro()
        String description = testMenuItem.getDisplayDescription();
        
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        assertNotNull(description);
        // Should return AI description since it's available (Pro status check removed)
        assertEquals("An AI-generated description of a fantastic burger", description);
        assertTrue(executionTime < 100, 
            "MenuItem.getDisplayDescription() took " + executionTime + "ms, suggesting infinite loop");
    }

    @Test
    void testFeedbackDisplayAnalysisNoInfiniteLoop() {
        // Test Feedback.getDisplayAnalysis() method that was causing infinite loops
        long startTime = System.currentTimeMillis();
        
        // This method previously called restaurant.isPro()
        String analysis = testFeedback.getDisplayAnalysis();
        
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        assertNotNull(analysis);
        // Should return AI analysis since it's available (Pro status check removed)
        assertEquals("Positive feedback about food quality and service", analysis);
        assertTrue(executionTime < 100, 
            "Feedback.getDisplayAnalysis() took " + executionTime + "ms, suggesting infinite loop");
    }

    @Test
    void testOrderDTOCreationNoInfiniteLoop() {
        // Test OrderDTO creation that was causing infinite loops via orderItem.getMenuItem().getName()
        long startTime = System.currentTimeMillis();
        
        // Use the safe OrderDTOService instead of unsafe OrderDTO constructor
        OrderDTO orderDTO = orderDTOService.createOrderDTO(testOrder);
        
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        assertNotNull(orderDTO);
        assertEquals("TEST-ORDER-001", orderDTO.getOrderNumber());
        assertEquals(1, orderDTO.getItems().size());
        assertEquals("Test Burger", orderDTO.getItems().get(0).getName());
        assertTrue(executionTime < 1000, 
            "OrderDTO creation took " + executionTime + "ms, suggesting infinite loop");
    }

    @Test
    void testOrderRestaurantIdAccessNoInfiniteLoop() {
        // Test getting restaurant ID from order without triggering lazy loading
        long startTime = System.currentTimeMillis();
        
        // Use the safe repository method instead of order.getRestaurant().getId()
        Long restaurantId = orderRepository.getRestaurantIdByOrderId(testOrder.getId());
        
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        assertNotNull(restaurantId);
        assertEquals(testRestaurant.getId(), restaurantId);
        assertTrue(executionTime < 100, 
            "Getting restaurant ID from order took " + executionTime + "ms, suggesting infinite loop");
    }

    @Test
    void testMenuItemNameFromOrderItemNoInfiniteLoop() {
        // Test getting menu item name from order item without triggering lazy loading
        long startTime = System.currentTimeMillis();
        
        // Use the safe repository method instead of orderItem.getMenuItem().getName()
        String menuItemName = orderItemRepository.getMenuItemNameByOrderItemId(testOrderItem.getId());
        
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        assertNotNull(menuItemName);
        assertEquals("Test Burger", menuItemName);
        assertTrue(executionTime < 100, 
            "Getting menu item name from order item took " + executionTime + "ms, suggesting infinite loop");
    }

    @Test
    void testCompleteMenuManagementFlowNoInfiniteLoop() {
        // Test complete menu management flow that would be used in menu management pages
        long startTime = System.currentTimeMillis();
        
        // 1. Get restaurant by owner (restaurant profile access)
        Optional<Restaurant> restaurantOpt = restaurantService.getRestaurantByOwnerId(testUser.getId());
        assertTrue(restaurantOpt.isPresent());
        
        // 2. Access menu items (menu management page)
        String description = testMenuItem.getDisplayDescription();
        assertNotNull(description);
        
        // 3. Process orders (order management)
        OrderDTO orderDTO = orderDTOService.createOrderDTO(testOrder);
        assertNotNull(orderDTO);
        
        // 4. Access feedback (feedback management)
        String analysis = testFeedback.getDisplayAnalysis();
        assertNotNull(analysis);
        
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        assertTrue(executionTime < 2000, 
            "Complete menu management flow took " + executionTime + "ms, suggesting infinite loop");
    }

    @Test
    void testMultipleRapidAccessesNoInfiniteLoop() {
        // Test multiple rapid accesses to ensure no cumulative infinite loop issues
        long startTime = System.currentTimeMillis();
        
        for (int i = 0; i < 20; i++) {
            // Simulate rapid page refreshes or multiple user actions
            restaurantService.getRestaurantByOwnerId(testUser.getId());
            testMenuItem.getDisplayDescription();
            testFeedback.getDisplayAnalysis();
            orderDTOService.createOrderDTO(testOrder);
            orderRepository.getRestaurantIdByOrderId(testOrder.getId());
            orderItemRepository.getMenuItemNameByOrderItemId(testOrderItem.getId());
        }
        
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        assertTrue(executionTime < 5000, 
            "20 rapid accesses took " + executionTime + "ms, suggesting infinite loop or performance issue");
    }
}
