package com.menux.menu_x_backend.unit;

import com.menux.menu_x_backend.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests to verify infinite loop fixes without requiring Spring context
 */
public class InfiniteLoopFixUnitTest {

    private Restaurant testRestaurant;
    private Menu testMenu;
    private MenuItem testMenuItem;
    private Feedback testFeedback;

    @BeforeEach
    void setUp() {
        // Create test restaurant
        testRestaurant = new Restaurant();
        testRestaurant.setId(1L);
        testRestaurant.setName("Test Restaurant");
        testRestaurant.setAddress("123 Test Street");
        testRestaurant.setSubscriptionPlan(Restaurant.SubscriptionPlan.PRO);
        testRestaurant.setIsActive(true);
        testRestaurant.setCreatedAt(LocalDateTime.now());

        // Create test menu
        testMenu = new Menu();
        testMenu.setId(1L);
        testMenu.setName("Test Menu");
        testMenu.setRestaurant(testRestaurant);
        testMenu.setIsActive(true);
        testMenu.setCreatedAt(LocalDateTime.now());

        // Create test menu item
        testMenuItem = new MenuItem();
        testMenuItem.setId(1L);
        testMenuItem.setName("Test Burger");
        testMenuItem.setDescription("A delicious test burger");
        testMenuItem.setAiDescription("An AI-generated description of a fantastic burger");
        testMenuItem.setPrice(new BigDecimal("15.99"));
        testMenuItem.setCategory(MenuItem.Category.MAIN_COURSE);
        testMenuItem.setMenu(testMenu);
        testMenuItem.setIsAvailable(true);
        testMenuItem.setCreatedAt(LocalDateTime.now());

        // Create test feedback
        testFeedback = new Feedback();
        testFeedback.setId(1L);
        testFeedback.setRestaurant(testRestaurant);
        testFeedback.setCustomerName("Test Customer");
        testFeedback.setRating(5);
        testFeedback.setComment("Great food!");
        testFeedback.setAiAnalysis("Positive feedback about food quality");
        testFeedback.setAiSentiment(Feedback.Sentiment.POSITIVE);
        testFeedback.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void testMenuItemGetDisplayDescriptionNoInfiniteLoop() {
        // Test that MenuItem.getDisplayDescription() doesn't cause infinite loops
        long startTime = System.currentTimeMillis();
        
        // This method previously called menu.getRestaurant().isPro() which caused infinite loops
        String description = testMenuItem.getDisplayDescription();
        
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        // Should return AI description since it's available (Pro status check removed)
        assertNotNull(description);
        assertEquals("An AI-generated description of a fantastic burger", description);
        
        // Should complete very quickly (under 10ms for unit test)
        assertTrue(executionTime < 10, 
            "MenuItem.getDisplayDescription() took " + executionTime + "ms, suggesting infinite loop");
    }

    @Test
    void testMenuItemGetDisplayDescriptionWithoutAiDescription() {
        // Test with menu item that has no AI description
        testMenuItem.setAiDescription(null);
        
        long startTime = System.currentTimeMillis();
        String description = testMenuItem.getDisplayDescription();
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        // Should return regular description
        assertEquals("A delicious test burger", description);
        assertTrue(executionTime < 10, 
            "MenuItem.getDisplayDescription() took " + executionTime + "ms, suggesting infinite loop");
    }

    @Test
    void testMenuItemGetDisplayDescriptionWithEmptyAiDescription() {
        // Test with menu item that has empty AI description
        testMenuItem.setAiDescription("");
        
        long startTime = System.currentTimeMillis();
        String description = testMenuItem.getDisplayDescription();
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        // Should return regular description
        assertEquals("A delicious test burger", description);
        assertTrue(executionTime < 10, 
            "MenuItem.getDisplayDescription() took " + executionTime + "ms, suggesting infinite loop");
    }

    @Test
    void testFeedbackGetDisplayAnalysisNoInfiniteLoop() {
        // Test that Feedback.getDisplayAnalysis() doesn't cause infinite loops
        long startTime = System.currentTimeMillis();
        
        // This method previously called restaurant.isPro() which caused infinite loops
        String analysis = testFeedback.getDisplayAnalysis();
        
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        // Should return AI analysis since it's available (Pro status check removed)
        assertNotNull(analysis);
        assertEquals("Positive feedback about food quality", analysis);
        
        // Should complete very quickly (under 10ms for unit test)
        assertTrue(executionTime < 10, 
            "Feedback.getDisplayAnalysis() took " + executionTime + "ms, suggesting infinite loop");
    }

    @Test
    void testFeedbackGetDisplayAnalysisWithoutAiAnalysis() {
        // Test with feedback that has no AI analysis
        testFeedback.setAiAnalysis(null);
        
        long startTime = System.currentTimeMillis();
        String analysis = testFeedback.getDisplayAnalysis();
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        // Should return null
        assertNull(analysis);
        assertTrue(executionTime < 10, 
            "Feedback.getDisplayAnalysis() took " + executionTime + "ms, suggesting infinite loop");
    }

    @Test
    void testFeedbackGetDisplayAnalysisWithEmptyAiAnalysis() {
        // Test with feedback that has empty AI analysis
        testFeedback.setAiAnalysis("");
        
        long startTime = System.currentTimeMillis();
        String analysis = testFeedback.getDisplayAnalysis();
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        // Should return null
        assertNull(analysis);
        assertTrue(executionTime < 10, 
            "Feedback.getDisplayAnalysis() took " + executionTime + "ms, suggesting infinite loop");
    }

    @Test
    void testMultipleRapidCallsNoInfiniteLoop() {
        // Test multiple rapid calls to ensure no cumulative infinite loop issues
        long startTime = System.currentTimeMillis();
        
        for (int i = 0; i < 100; i++) {
            // Simulate rapid method calls
            testMenuItem.getDisplayDescription();
            testFeedback.getDisplayAnalysis();
        }
        
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        // 100 calls should complete very quickly (under 100ms for unit test)
        assertTrue(executionTime < 100, 
            "100 rapid calls took " + executionTime + "ms, suggesting infinite loop or performance issue");
    }

    @Test
    void testRestaurantIsProMethodStillWorks() {
        // Verify that Restaurant.isPro() method still works correctly
        long startTime = System.currentTimeMillis();
        
        boolean isPro = testRestaurant.isPro();
        
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        assertTrue(isPro); // Should be true since we set it to PRO
        assertTrue(executionTime < 10, 
            "Restaurant.isPro() took " + executionTime + "ms, suggesting infinite loop");
    }

    @Test
    void testRestaurantIsProWithBasicPlan() {
        // Test with BASIC plan
        testRestaurant.setSubscriptionPlan(Restaurant.SubscriptionPlan.BASIC);
        
        long startTime = System.currentTimeMillis();
        boolean isPro = testRestaurant.isPro();
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        assertFalse(isPro); // Should be false for BASIC plan
        assertTrue(executionTime < 10, 
            "Restaurant.isPro() took " + executionTime + "ms, suggesting infinite loop");
    }

    @Test
    void testFeedbackHasAiAnalysisMethod() {
        // Test the hasAiAnalysis() helper method
        long startTime = System.currentTimeMillis();
        
        boolean hasAnalysis = testFeedback.hasAiAnalysis();
        
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        assertTrue(hasAnalysis); // Should be true since we set AI analysis
        assertTrue(executionTime < 10, 
            "Feedback.hasAiAnalysis() took " + executionTime + "ms, suggesting infinite loop");
    }
}
