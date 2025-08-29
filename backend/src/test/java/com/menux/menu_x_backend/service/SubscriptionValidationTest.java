package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.RestaurantSubscription;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.repository.RestaurantSubscriptionRepository;
import com.menux.menu_x_backend.repository.RestaurantSubscriptionEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = "spring.profiles.active=test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class SubscriptionValidationTest {

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private RestaurantSubscriptionRepository subscriptionRepository;

    @Autowired
    private RestaurantSubscriptionEventRepository eventRepository;

    @MockBean
    private PlatformSettingService platformSettingService;

    @MockBean
    private NotificationService notificationService;

    private Long restaurantId;

    @BeforeEach
    void setupRestaurant() {
        Restaurant r = new Restaurant();
        r.setName("Test Restaurant");
        r.setAddress("Test Address");
        r.setOwnerId(1001L);
        restaurantId = restaurantRepository.save(r).getId();

        // Mock platform settings
        Mockito.when(platformSettingService.getIntegerSetting(eq("SUB_GRACE_DAYS_DEFAULT"), anyInt())).thenReturn(3);
    }

    @Test
    @DisplayName("isValidProSubscription returns true for active trial")
    @Transactional
    void testValidTrialSubscription() {
        // Create active trial
        RestaurantSubscription sub = subscriptionService.ensureSubscription(restaurantId);
        sub.setStatus(RestaurantSubscription.Status.TRIALING);
        sub.setTrialStartAt(LocalDateTime.now().minusDays(5));
        sub.setTrialEndAt(LocalDateTime.now().plusDays(5)); // 5 days remaining
        subscriptionRepository.save(sub);

        assertTrue(subscriptionService.isValidProSubscription(restaurantId));
    }

    @Test
    @DisplayName("isValidProSubscription returns false for expired trial")
    @Transactional
    void testExpiredTrialSubscription() {
        // Create expired trial
        RestaurantSubscription sub = subscriptionService.ensureSubscription(restaurantId);
        sub.setStatus(RestaurantSubscription.Status.TRIALING);
        sub.setTrialStartAt(LocalDateTime.now().minusDays(20));
        sub.setTrialEndAt(LocalDateTime.now().minusDays(5)); // Expired 5 days ago
        subscriptionRepository.save(sub);

        assertFalse(subscriptionService.isValidProSubscription(restaurantId));
    }

    @Test
    @DisplayName("isValidProSubscription returns true for active paid subscription")
    @Transactional
    void testValidPaidSubscription() {
        // Create active paid subscription
        RestaurantSubscription sub = subscriptionService.ensureSubscription(restaurantId);
        sub.setStatus(RestaurantSubscription.Status.ACTIVE);
        sub.setCurrentPeriodStartAt(LocalDateTime.now().minusDays(10));
        sub.setCurrentPeriodEndAt(LocalDateTime.now().plusDays(20)); // 20 days remaining
        subscriptionRepository.save(sub);

        assertTrue(subscriptionService.isValidProSubscription(restaurantId));
    }

    @Test
    @DisplayName("isValidProSubscription returns true for grace period")
    @Transactional
    void testGracePeriodSubscription() {
        // Create subscription in grace period
        RestaurantSubscription sub = subscriptionService.ensureSubscription(restaurantId);
        sub.setStatus(RestaurantSubscription.Status.GRACE);
        sub.setTrialStartAt(LocalDateTime.now().minusDays(20));
        sub.setTrialEndAt(LocalDateTime.now().minusDays(1)); // Expired 1 day ago, within grace period
        subscriptionRepository.save(sub);

        assertTrue(subscriptionService.isValidProSubscription(restaurantId));
    }

    @Test
    @DisplayName("isValidProSubscription returns false for expired subscription")
    @Transactional
    void testExpiredSubscription() {
        // Create expired subscription
        RestaurantSubscription sub = subscriptionService.ensureSubscription(restaurantId);
        sub.setStatus(RestaurantSubscription.Status.EXPIRED);
        subscriptionRepository.save(sub);

        assertFalse(subscriptionService.isValidProSubscription(restaurantId));
    }

    @Test
    @DisplayName("forceExpireSubscription immediately expires active subscription")
    @Transactional
    void testForceExpireSubscription() {
        // Create active subscription
        RestaurantSubscription sub = subscriptionService.ensureSubscription(restaurantId);
        sub.setStatus(RestaurantSubscription.Status.ACTIVE);
        sub.setCurrentPeriodStartAt(LocalDateTime.now().minusDays(10));
        sub.setCurrentPeriodEndAt(LocalDateTime.now().plusDays(20));
        subscriptionRepository.save(sub);

        // Force expire
        RestaurantSubscription expired = subscriptionService.forceExpireSubscription(restaurantId, "Test reason");

        assertEquals(RestaurantSubscription.Status.EXPIRED, expired.getStatus());
        assertTrue(expired.getCancelAtPeriodEnd());
        assertNotNull(expired.getCanceledAt());

        // Check restaurant plan was downgraded
        Restaurant restaurant = restaurantRepository.findById(restaurantId).orElseThrow();
        assertEquals(Restaurant.SubscriptionPlan.BASIC, restaurant.getSubscriptionPlan());
    }

    @Test
    @DisplayName("Enhanced runDailyChecks handles legacy ACTIVE subscriptions without end dates")
    @Transactional
    void testDailyChecksHandlesLegacyData() {
        // Create legacy ACTIVE subscription without end dates
        RestaurantSubscription sub = subscriptionService.ensureSubscription(restaurantId);
        sub.setStatus(RestaurantSubscription.Status.ACTIVE);
        sub.setCurrentPeriodEndAt(null);
        sub.setTrialEndAt(null);
        subscriptionRepository.save(sub);

        // Run daily checks
        subscriptionService.runDailyChecks();

        // Should be expired now
        RestaurantSubscription updated = subscriptionRepository.findByRestaurantId(restaurantId).orElseThrow();
        assertEquals(RestaurantSubscription.Status.EXPIRED, updated.getStatus());

        // Restaurant should be downgraded
        Restaurant restaurant = restaurantRepository.findById(restaurantId).orElseThrow();
        assertEquals(Restaurant.SubscriptionPlan.BASIC, restaurant.getSubscriptionPlan());
    }

    @Test
    @DisplayName("Enhanced runDailyChecks ensures subscription plan consistency")
    @Transactional
    void testDailyChecksEnsuresConsistency() {
        // Create expired subscription but restaurant still has PRO plan
        RestaurantSubscription sub = subscriptionService.ensureSubscription(restaurantId);
        sub.setStatus(RestaurantSubscription.Status.EXPIRED);
        subscriptionRepository.save(sub);

        Restaurant restaurant = restaurantRepository.findById(restaurantId).orElseThrow();
        restaurant.setSubscriptionPlan(Restaurant.SubscriptionPlan.PRO); // Inconsistent state
        restaurantRepository.save(restaurant);

        // Run daily checks
        subscriptionService.runDailyChecks();

        // Should be fixed to BASIC
        Restaurant updated = restaurantRepository.findById(restaurantId).orElseThrow();
        assertEquals(Restaurant.SubscriptionPlan.BASIC, updated.getSubscriptionPlan());
    }
}
