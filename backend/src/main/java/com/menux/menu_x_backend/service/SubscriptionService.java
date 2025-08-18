package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.entity.Notification;
import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.RestaurantSubscription;
import com.menux.menu_x_backend.entity.RestaurantSubscriptionEvent;
import com.menux.menu_x_backend.entity.ManualPayment;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.repository.RestaurantSubscriptionEventRepository;
import com.menux.menu_x_backend.repository.RestaurantSubscriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class SubscriptionService {

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private RestaurantSubscriptionRepository subscriptionRepository;

    @Autowired
    private RestaurantSubscriptionEventRepository eventRepository;

    @Autowired
    private PlatformSettingService platformSettingService;

    @Autowired
    private NotificationService notificationService;

    // Ensure a subscription row exists for a restaurant
    @Transactional
    public RestaurantSubscription ensureSubscription(Long restaurantId) {
        Optional<RestaurantSubscription> existing = subscriptionRepository.findByRestaurantId(restaurantId);
        if (existing.isPresent()) return existing.get();
        RestaurantSubscription sub = new RestaurantSubscription();
        sub.setRestaurantId(restaurantId);
        sub.setPlan(RestaurantSubscription.Plan.PRO);
        sub.setStatus(RestaurantSubscription.Status.EXPIRED);
        sub = subscriptionRepository.save(sub);
        eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), "CREATED", null));
        return sub;
    }

    // Start a trial if allowed
    @Transactional
    public RestaurantSubscription startTrial(Long restaurantId) {
        boolean trialEnabled = platformSettingService.getBooleanSetting("SUB_TRIAL_ENABLED", true);
        int trialDays = platformSettingService.getIntegerSetting("SUB_TRIAL_DAYS_DEFAULT", 14);
        boolean trialOnce = platformSettingService.getBooleanSetting("SUB_TRIAL_ONCE_PER_RESTAURANT", true);

        RestaurantSubscription sub = ensureSubscription(restaurantId);
        if (!trialEnabled) throw new RuntimeException("Trial is currently disabled");
        if (trialOnce && sub.getTrialStartAt() != null) throw new RuntimeException("Trial already used for this restaurant");

        LocalDateTime now = LocalDateTime.now();
        sub.setTrialStartAt(now);
        sub.setTrialEndAt(now.plusDays(trialDays));
        sub.setStatus(RestaurantSubscription.Status.TRIALING);
        sub = subscriptionRepository.save(sub);
        eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), "TRIAL_STARTED", null));

        // During trial, grant PRO entitlements
        setRestaurantPlan(restaurantId, Restaurant.SubscriptionPlan.PRO);
        return sub;
    }

    // Admin: directly set trial days
    @Transactional
    public RestaurantSubscription setTrialDays(Long restaurantId, int days) {
        if (days <= 0) throw new RuntimeException("Days must be > 0");

        RestaurantSubscription sub = ensureSubscription(restaurantId);
        LocalDateTime now = LocalDateTime.now();

        sub.setTrialStartAt(now);
        sub.setTrialEndAt(now.plusDays(days));

        // If not currently within a paid period, move to TRIALING and grant PRO entitlements
        if (sub.getCurrentPeriodEndAt() == null || sub.getCurrentPeriodEndAt().isBefore(now)) {
            sub.setStatus(RestaurantSubscription.Status.TRIALING);
            setRestaurantPlan(restaurantId, Restaurant.SubscriptionPlan.PRO);
        }

        sub = subscriptionRepository.save(sub);
        eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), "TRIAL_DAYS_SET", String.format("{\"days\":%d}", days)));
        return sub;
    }

    // Admin: directly set paid days (overwrites current period to now..now+days)
    @Transactional
    public RestaurantSubscription setPaidDays(Long restaurantId, int days) {
        if (days <= 0) throw new RuntimeException("Days must be > 0");

        RestaurantSubscription sub = ensureSubscription(restaurantId);
        LocalDateTime now = LocalDateTime.now();

        sub.setCurrentPeriodStartAt(now);
        sub.setCurrentPeriodEndAt(now.plusDays(days));
        sub.setStatus(RestaurantSubscription.Status.ACTIVE);
        sub.setCancelAtPeriodEnd(false);
        sub.setCanceledAt(null);

        sub = subscriptionRepository.save(sub);

        // Sync restaurant PRO status
        setRestaurantPlan(restaurantId, Restaurant.SubscriptionPlan.PRO);

        eventRepository.save(new RestaurantSubscriptionEvent(
                sub.getId(),
                "PAID_DAYS_SET",
                String.format("{\"days\":%d}", days)
        ));
        return sub;
    }

    // Admin: suspend subscription immediately
    @Transactional
    public RestaurantSubscription suspend(Long restaurantId, String reason) {
        RestaurantSubscription sub = ensureSubscription(restaurantId);
        LocalDateTime now = LocalDateTime.now();

        // End any active/paid period and set to EXPIRED to disable entitlements
        sub.setCurrentPeriodEndAt(now);
        sub.setStatus(RestaurantSubscription.Status.EXPIRED);
        sub.setCancelAtPeriodEnd(true);
        sub.setCanceledAt(now);

        sub = subscriptionRepository.save(sub);

        // Downgrade entitlements
        setRestaurantPlan(restaurantId, Restaurant.SubscriptionPlan.BASIC);

        String meta = null;
        if (reason != null && !reason.isBlank()) {
            String safe = reason.replace("\"", "\\\"");
            meta = String.format("{\"reason\":\"%s\"}", safe);
        }
        eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), "SUSPENDED", meta));
        return sub;
    }

    // Admin: unsuspend/reactivate subscription according to current timelines
    @Transactional
    public RestaurantSubscription unsuspend(Long restaurantId) {
        RestaurantSubscription sub = ensureSubscription(restaurantId);
        LocalDateTime now = LocalDateTime.now();

        int graceDays = platformSettingService.getIntegerSetting("SUB_GRACE_DAYS_DEFAULT", 3);

        Restaurant.SubscriptionPlan planToSet = Restaurant.SubscriptionPlan.BASIC;
        RestaurantSubscription.Status newStatus = RestaurantSubscription.Status.EXPIRED;

        // If there is/was a paid period, restore ACTIVE/GRACE/EXPIRED accordingly
        if (sub.getCurrentPeriodEndAt() != null) {
            LocalDateTime end = sub.getCurrentPeriodEndAt();
            if (now.isBefore(end)) {
                newStatus = RestaurantSubscription.Status.ACTIVE;
                planToSet = Restaurant.SubscriptionPlan.PRO;
            } else if (now.isBefore(end.plusDays(graceDays))) {
                newStatus = RestaurantSubscription.Status.GRACE;
                planToSet = Restaurant.SubscriptionPlan.PRO;
            } else {
                newStatus = RestaurantSubscription.Status.EXPIRED;
                planToSet = Restaurant.SubscriptionPlan.BASIC;
            }
        } else if (sub.getTrialEndAt() != null) {
            // Otherwise restore based on trial window if present
            LocalDateTime trialEnd = sub.getTrialEndAt();
            if (now.isBefore(trialEnd)) {
                newStatus = RestaurantSubscription.Status.TRIALING;
                planToSet = Restaurant.SubscriptionPlan.PRO;
            } else if (now.isBefore(trialEnd.plusDays(graceDays))) {
                newStatus = RestaurantSubscription.Status.GRACE;
                planToSet = Restaurant.SubscriptionPlan.PRO;
            } else {
                newStatus = RestaurantSubscription.Status.EXPIRED;
                planToSet = Restaurant.SubscriptionPlan.BASIC;
            }
        } else {
            // No active paid/trial data -> remain EXPIRED
            newStatus = RestaurantSubscription.Status.EXPIRED;
            planToSet = Restaurant.SubscriptionPlan.BASIC;
        }

        sub.setStatus(newStatus);
        // Clear cancellation flags when restoring access
        if (newStatus == RestaurantSubscription.Status.ACTIVE
                || newStatus == RestaurantSubscription.Status.GRACE
                || newStatus == RestaurantSubscription.Status.TRIALING) {
            sub.setCancelAtPeriodEnd(false);
            sub.setCanceledAt(null);
        }

        sub = subscriptionRepository.save(sub);

        // Sync restaurant entitlements
        setRestaurantPlan(restaurantId, planToSet);

        // Log event for precedence-based UIs
        eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), "UNSUSPENDED", null));

        return sub;
    }

    // Handle approved manual payment -> extend paid period
    @Transactional
    public void onManualPaymentApproved(ManualPayment mp) {
        int periodDays = platformSettingService.getIntegerSetting("SUB_PRO_PERIOD_DAYS", 30);
        grantPaidDays(mp.getRestaurantId(), periodDays, "MANUAL_PAYMENT",
                String.format("{\"paymentId\":%d,\"trxId\":\"%s\",\"amount\":%s}", mp.getId(), mp.getTrxId(), mp.getAmount().toPlainString()));
    }

    // Admin/manual grant of paid days
    @Transactional
    public void grantPaidDays(Long restaurantId, int days, String source, String metaJson) {
        if (days <= 0) throw new RuntimeException("Days must be > 0");
        RestaurantSubscription sub = ensureSubscription(restaurantId);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime newStart = sub.getCurrentPeriodStartAt();
        LocalDateTime newEnd;

        if (sub.getCurrentPeriodEndAt() == null || sub.getCurrentPeriodEndAt().isBefore(now)) {
            newStart = now;
            newEnd = now.plusDays(days);
        } else {
            newEnd = sub.getCurrentPeriodEndAt().plusDays(days);
        }

        sub.setCurrentPeriodStartAt(newStart);
        sub.setCurrentPeriodEndAt(newEnd);
        sub.setStatus(RestaurantSubscription.Status.ACTIVE);
        sub.setCancelAtPeriodEnd(false);
        sub.setCanceledAt(null);
        subscriptionRepository.save(sub);

        // Sync restaurant PRO status
        setRestaurantPlan(restaurantId, Restaurant.SubscriptionPlan.PRO);

        // Event + Notify
        String eventType = (source != null && !source.isBlank()) ? (source + "_GRANT").toUpperCase() : "GRANT";
        eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), eventType, metaJson));

        Restaurant restaurant = restaurantRepository.findById(restaurantId).orElse(null);
        if (restaurant != null) {
            Long ownerId = restaurant.getOwnerId();
            String title = "Subscription extended";
            String body = "Your PRO subscription has been extended to " + newEnd.toLocalDate() + ".";
            notificationService.createNotification(ownerId, restaurantId, Notification.Type.GENERIC, title, body,
                    Map.of(
                            "subscriptionId", sub.getId(),
                            "currentPeriodEndAt", newEnd.toString(),
                            "source", source == null ? "GRANT" : source
                    ));
        }
    }

    // Daily checks for transitions and reminders
    @Transactional
    public void runDailyChecks() {
        int graceDays = platformSettingService.getIntegerSetting("SUB_GRACE_DAYS_DEFAULT", 3);
        int notifyTrialBefore = platformSettingService.getIntegerSetting("SUB_NOTIFY_DAYS_BEFORE_TRIAL_END", 3);
        int notifyPeriodBefore = platformSettingService.getIntegerSetting("SUB_NOTIFY_DAYS_BEFORE_PERIOD_END", 5);
        LocalDateTime now = LocalDateTime.now();

        List<RestaurantSubscription> subs = subscriptionRepository.findAll();
        for (RestaurantSubscription sub : subs) {
            Restaurant restaurant = restaurantRepository.findById(sub.getRestaurantId()).orElse(null);
            if (restaurant == null) continue;
            Long ownerId = restaurant.getOwnerId();

            // Trial reminders and transitions (handle TRIALING reminders; transitions apply if no paid period exists)
            if (sub.getTrialEndAt() != null && sub.getCurrentPeriodEndAt() == null) {
                if (sub.getStatus() == RestaurantSubscription.Status.TRIALING) {
                    LocalDateTime remindAt = sub.getTrialEndAt().minusDays(notifyTrialBefore);
                    if (!now.isBefore(remindAt) && now.isBefore(sub.getTrialEndAt())) {
                        notify(ownerId, sub.getRestaurantId(), "Trial ending soon", "Your trial ends on " + sub.getTrialEndAt().toLocalDate() + ".",
                                Map.of("subscriptionId", sub.getId(), "phase", "TRIAL"));
                    }
                }

                // Transition to GRACE/EXPIRED once trial has ended
                if (!now.isBefore(sub.getTrialEndAt())) {
                    LocalDateTime graceEnd = sub.getTrialEndAt().plusDays(graceDays);
                    if (now.isBefore(graceEnd)) {
                        if (sub.getStatus() != RestaurantSubscription.Status.GRACE) {
                            sub.setStatus(RestaurantSubscription.Status.GRACE);
                            subscriptionRepository.save(sub);
                            eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), "TRIAL_GRACE_STARTED", null));
                        }
                        setRestaurantPlan(sub.getRestaurantId(), Restaurant.SubscriptionPlan.PRO);
                    } else {
                        sub.setStatus(RestaurantSubscription.Status.EXPIRED);
                        subscriptionRepository.save(sub);
                        eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), "TRIAL_EXPIRED", null));
                        setRestaurantPlan(sub.getRestaurantId(), Restaurant.SubscriptionPlan.BASIC);
                        notify(ownerId, sub.getRestaurantId(), "Trial expired", "Your trial has expired.", Map.of("subscriptionId", sub.getId()));
                    }
                }
            }

            if ((sub.getStatus() == RestaurantSubscription.Status.ACTIVE || sub.getStatus() == RestaurantSubscription.Status.GRACE)
                    && sub.getCurrentPeriodEndAt() != null) {
                LocalDateTime remindAt = sub.getCurrentPeriodEndAt().minusDays(notifyPeriodBefore);
                if (!now.isBefore(remindAt) && now.isBefore(sub.getCurrentPeriodEndAt())) {
                    notify(ownerId, sub.getRestaurantId(), "Subscription ending soon", "Your PRO period ends on " + sub.getCurrentPeriodEndAt().toLocalDate() + ".",
                            Map.of("subscriptionId", sub.getId(), "phase", "PAID"));
                }
                // Transition on period end
                if (!now.isBefore(sub.getCurrentPeriodEndAt())) {
                    LocalDateTime graceEnd = sub.getCurrentPeriodEndAt().plusDays(graceDays);
                    if (now.isBefore(graceEnd)) {
                        if (sub.getStatus() != RestaurantSubscription.Status.GRACE) {
                            sub.setStatus(RestaurantSubscription.Status.GRACE);
                            subscriptionRepository.save(sub);
                            eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), "PERIOD_GRACE_STARTED", null));
                        }
                        setRestaurantPlan(sub.getRestaurantId(), Restaurant.SubscriptionPlan.PRO);
                    } else {
                        sub.setStatus(RestaurantSubscription.Status.EXPIRED);
                        subscriptionRepository.save(sub);
                        eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), "SUBSCRIPTION_EXPIRED", null));
                        setRestaurantPlan(sub.getRestaurantId(), Restaurant.SubscriptionPlan.BASIC);
                        notify(ownerId, sub.getRestaurantId(), "Subscription expired", "Your PRO subscription has expired.", Map.of("subscriptionId", sub.getId()));
                    }
                }
            }
        }
    }

    private void notify(Long userId, Long restaurantId, String title, String body, Map<String, Object> data) {
        try {
            notificationService.createNotification(userId, restaurantId, Notification.Type.GENERIC, title, body, data);
        } catch (Exception ignored) { }
    }

    @Transactional
    public void setRestaurantPlan(Long restaurantId, Restaurant.SubscriptionPlan plan) {
        restaurantRepository.findById(restaurantId).ifPresent(r -> {
            if (r.getSubscriptionPlan() != plan) {
                r.setSubscriptionPlan(plan);
                restaurantRepository.save(r);
            }
        });
    }
}
