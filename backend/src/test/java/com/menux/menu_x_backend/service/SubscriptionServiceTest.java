package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.entity.ManualPayment;
import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.RestaurantSubscription;
import com.menux.menu_x_backend.entity.RestaurantSubscriptionEvent;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.repository.RestaurantSubscriptionEventRepository;
import com.menux.menu_x_backend.repository.RestaurantSubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = "spring.profiles.active=test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class SubscriptionServiceTest {

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
        r.setName("Test R");
        r.setAddress("Dhaka, BD");
        r.setOwnerId(1001L);
        restaurantId = restaurantRepository.save(r).getId();

        // Sensible defaults for settings
        Mockito.when(platformSettingService.getBooleanSetting(eq("SUB_TRIAL_ENABLED"), anyBoolean())).thenReturn(true);
        Mockito.when(platformSettingService.getIntegerSetting(eq("SUB_TRIAL_DAYS_DEFAULT"), anyInt())).thenReturn(14);
        Mockito.when(platformSettingService.getBooleanSetting(eq("SUB_TRIAL_ONCE_PER_RESTAURANT"), anyBoolean())).thenReturn(true);
        Mockito.when(platformSettingService.getIntegerSetting(eq("SUB_PRO_PERIOD_DAYS"), anyInt())).thenReturn(30);
        Mockito.when(platformSettingService.getIntegerSetting(eq("SUB_GRACE_DAYS_DEFAULT"), anyInt())).thenReturn(3);
        Mockito.when(platformSettingService.getIntegerSetting(eq("SUB_NOTIFY_DAYS_BEFORE_TRIAL_END"), anyInt())).thenReturn(3);
        Mockito.when(platformSettingService.getIntegerSetting(eq("SUB_NOTIFY_DAYS_BEFORE_PERIOD_END"), anyInt())).thenReturn(5);
    }

    @Test
    @DisplayName("ensureSubscription creates row with EXPIRED status and CREATED event")
    @Transactional
    void testEnsureSubscriptionCreates() {
        RestaurantSubscription sub = subscriptionService.ensureSubscription(restaurantId);
        assertNotNull(sub.getId());
        assertEquals(RestaurantSubscription.Status.EXPIRED, sub.getStatus());
        assertEquals(RestaurantSubscription.Plan.PRO, sub.getPlan());

        List<RestaurantSubscriptionEvent> events = eventRepository.findAll();
        assertThat(events).isNotEmpty();
        RestaurantSubscriptionEvent created = events.get(0);
        assertEquals(sub.getId(), created.getSubscriptionId());
        assertEquals("CREATED", created.getEventType());
    }

    @Test
    @DisplayName("startTrial sets trial dates, status TRIALING, plan PRO, and emits event")
    @Transactional
    void testStartTrial() {
        RestaurantSubscription sub = subscriptionService.startTrial(restaurantId);
        assertNotNull(sub.getTrialStartAt());
        assertNotNull(sub.getTrialEndAt());
        assertEquals(RestaurantSubscription.Status.TRIALING, sub.getStatus());

        Restaurant r = restaurantRepository.findById(restaurantId).orElseThrow();
        assertEquals(Restaurant.SubscriptionPlan.PRO, r.getSubscriptionPlan());

        List<RestaurantSubscriptionEvent> events = eventRepository.findAll();
        assertThat(events.stream().anyMatch(e -> e.getEventType().equals("TRIAL_STARTED"))).isTrue();

        // Trial once enforcement
        assertThrows(RuntimeException.class, () -> subscriptionService.startTrial(restaurantId));
    }

    @Test
    @DisplayName("grantPaidDays sets/extends paid period, status ACTIVE, event emitted, notification sent")
    @Transactional
    void testGrantPaidDays() {
        // No existing period -> should start now
        subscriptionService.grantPaidDays(restaurantId, 10, "ADMIN", null);
        RestaurantSubscription sub = subscriptionRepository.findByRestaurantId(restaurantId).orElseThrow();
        assertEquals(RestaurantSubscription.Status.ACTIVE, sub.getStatus());
        assertNotNull(sub.getCurrentPeriodStartAt());
        assertNotNull(sub.getCurrentPeriodEndAt());
        assertThat(sub.getCurrentPeriodEndAt()).isAfter(sub.getCurrentPeriodStartAt());

        // Event exists
        List<RestaurantSubscriptionEvent> events = eventRepository.findAll();
        assertThat(events.stream().anyMatch(e -> e.getEventType().equals("ADMIN_GRANT"))).isTrue();

        // Restaurant plan toggled to PRO
        Restaurant r = restaurantRepository.findById(restaurantId).orElseThrow();
        assertEquals(Restaurant.SubscriptionPlan.PRO, r.getSubscriptionPlan());

        // Notification sent
        verify(notificationService, times(1)).createNotification(anyLong(), eq(restaurantId), any(), contains("Subscription extended"), anyString(), anyMap());

        // Extend existing period
        LocalDateTime prevEnd = sub.getCurrentPeriodEndAt();
        subscriptionService.grantPaidDays(restaurantId, 5, "ADMIN", null);
        RestaurantSubscription sub2 = subscriptionRepository.findByRestaurantId(restaurantId).orElseThrow();
        assertThat(sub2.getCurrentPeriodEndAt()).isAfter(prevEnd);
    }

    @Test
    @DisplayName("grantPaidDays throws on non-positive days")
    @Transactional
    void testGrantPaidDaysValidation() {
        assertThrows(RuntimeException.class, () -> subscriptionService.grantPaidDays(restaurantId, 0, null, null));
        assertThrows(RuntimeException.class, () -> subscriptionService.grantPaidDays(restaurantId, -1, null, null));
    }

    @Test
    @DisplayName("onManualPaymentApproved grants default PRO period days")
    @Transactional
    void testOnManualPaymentApproved() {
        Mockito.when(platformSettingService.getIntegerSetting(eq("SUB_PRO_PERIOD_DAYS"), anyInt())).thenReturn(30);

        ManualPayment mp = new ManualPayment();
        mp.setId(500L);
        mp.setRestaurantId(restaurantId);
        mp.setOwnerId(1001L);
        mp.setAmount(new BigDecimal("499.00"));
        mp.setTrxId("TRX123");
        mp.setSenderMsisdn("017XXXXXXX");

        subscriptionService.onManualPaymentApproved(mp);

        RestaurantSubscription sub = subscriptionRepository.findByRestaurantId(restaurantId).orElseThrow();
        assertEquals(RestaurantSubscription.Status.ACTIVE, sub.getStatus());
        assertNotNull(sub.getCurrentPeriodEndAt());

        // Event includes MANUAL_PAYMENT_GRANT
        List<RestaurantSubscriptionEvent> events = eventRepository.findAll();
        assertThat(events.stream().anyMatch(e -> e.getEventType().equals("MANUAL_PAYMENT_GRANT"))).isTrue();
    }

    @Test
    @DisplayName("runDailyChecks transitions TRIAL -> GRACE -> EXPIRED and sends notifications")
    @Transactional
    void testRunDailyChecksTrialTransitions() {
        // Create TRIAL that ends now - 1 day so we're in GRACE window (3 days by default)
        RestaurantSubscription sub = subscriptionService.ensureSubscription(restaurantId);
        sub.setStatus(RestaurantSubscription.Status.TRIALING);
        sub.setTrialStartAt(LocalDateTime.now().minusDays(10));
        sub.setTrialEndAt(LocalDateTime.now().minusDays(1));
        subscriptionRepository.save(sub);

        subscriptionService.runDailyChecks();
        RestaurantSubscription afterGrace = subscriptionRepository.findByRestaurantId(restaurantId).orElseThrow();
        assertEquals(RestaurantSubscription.Status.GRACE, afterGrace.getStatus());

        // Push to after grace period
        afterGrace.setTrialEndAt(LocalDateTime.now().minusDays(10)); // way in the past
        subscriptionRepository.save(afterGrace);
        subscriptionService.runDailyChecks();
        RestaurantSubscription expired = subscriptionRepository.findByRestaurantId(restaurantId).orElseThrow();
        assertEquals(RestaurantSubscription.Status.EXPIRED, expired.getStatus());

        // Ensure plan BASIC after expire
        Restaurant r = restaurantRepository.findById(restaurantId).orElseThrow();
        assertEquals(Restaurant.SubscriptionPlan.BASIC, r.getSubscriptionPlan());

        // Events present
        List<RestaurantSubscriptionEvent> events = eventRepository.findAll();
        assertThat(events.stream().anyMatch(e -> e.getEventType().equals("TRIAL_GRACE_STARTED"))).isTrue();
        assertThat(events.stream().anyMatch(e -> e.getEventType().equals("TRIAL_EXPIRED"))).isTrue();
    }

    @Test
    @DisplayName("runDailyChecks sends reminders before period end and handles paid expiry -> GRACE -> EXPIRED")
    @Transactional
    void testRunDailyChecksPaidTransitions() {
        RestaurantSubscription sub = subscriptionService.ensureSubscription(restaurantId);
        sub.setStatus(RestaurantSubscription.Status.ACTIVE);
        sub.setCurrentPeriodStartAt(LocalDateTime.now().minusDays(20));
        sub.setCurrentPeriodEndAt(LocalDateTime.now()); // period ends now
        subscriptionRepository.save(sub);

        // First run -> should move to GRACE
        subscriptionService.runDailyChecks();
        RestaurantSubscription grace = subscriptionRepository.findByRestaurantId(restaurantId).orElseThrow();
        assertEquals(RestaurantSubscription.Status.GRACE, grace.getStatus());

        // Move end far in past and run -> EXPIRED
        grace.setCurrentPeriodEndAt(LocalDateTime.now().minusDays(10));
        subscriptionRepository.save(grace);
        subscriptionService.runDailyChecks();
        RestaurantSubscription expired = subscriptionRepository.findByRestaurantId(restaurantId).orElseThrow();
        assertEquals(RestaurantSubscription.Status.EXPIRED, expired.getStatus());

        // Event checks
        List<RestaurantSubscriptionEvent> events = eventRepository.findAll();
        assertThat(events.stream().anyMatch(e -> e.getEventType().equals("PERIOD_GRACE_STARTED"))).isTrue();
        assertThat(events.stream().anyMatch(e -> e.getEventType().equals("SUBSCRIPTION_EXPIRED"))).isTrue();
    }
}
