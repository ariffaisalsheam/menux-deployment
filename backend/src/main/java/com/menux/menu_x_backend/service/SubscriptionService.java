package com.menux.menu_x_backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.menux.menu_x_backend.dto.subscription.SubscriptionAuditReport;
import com.menux.menu_x_backend.entity.ManualPayment;
import com.menux.menu_x_backend.entity.Notification;
import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.RestaurantSubscription;
import com.menux.menu_x_backend.entity.RestaurantSubscriptionEvent;
import com.menux.menu_x_backend.exception.SubscriptionException;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.repository.RestaurantSubscriptionEventRepository;
import com.menux.menu_x_backend.repository.RestaurantSubscriptionRepository;

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

        // Determine plan based on restaurant's current subscription plan
        Optional<Restaurant> restaurant = restaurantRepository.findById(restaurantId);
        if (restaurant.isPresent() && restaurant.get().getSubscriptionPlan() == Restaurant.SubscriptionPlan.PRO) {
            sub.setPlan(RestaurantSubscription.Plan.PRO);
            sub.setStatus(RestaurantSubscription.Status.ACTIVE);
        } else {
            sub.setPlan(RestaurantSubscription.Plan.BASIC);
            sub.setStatus(RestaurantSubscription.Status.EXPIRED);
        }
        sub = subscriptionRepository.save(sub);

        // Log subscription creation with detailed metadata
        String metadata = String.format(
            "{\"action\":\"created\",\"plan\":\"%s\",\"status\":\"%s\",\"restaurantId\":%d}",
            sub.getPlan().name(), sub.getStatus().name(), restaurantId
        );
        eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), "CREATED", metadata));
        return sub;
    }

    // Start a trial if allowed
    @Transactional
    public RestaurantSubscription startTrial(Long restaurantId) {
        // Validate restaurant exists
        if (!restaurantRepository.existsById(restaurantId)) {
            throw SubscriptionException.restaurantNotFound(restaurantId);
        }

        boolean trialEnabled = platformSettingService.getBooleanSetting("SUB_TRIAL_ENABLED", true);
        int trialDays = platformSettingService.getIntegerSetting("SUB_TRIAL_DAYS_DEFAULT", 14);
        boolean trialOnce = platformSettingService.getBooleanSetting("SUB_TRIAL_ONCE_PER_RESTAURANT", true);

        if (!trialEnabled) {
            throw SubscriptionException.trialDisabled();
        }

        RestaurantSubscription sub = ensureSubscription(restaurantId);

        // Enhanced trial eligibility checks
        if (trialOnce && sub.getTrialStartAt() != null) {
            throw SubscriptionException.trialAlreadyUsed(restaurantId);
        }

        // Check current status - only allow trial for new/expired/canceled subscriptions
        if (sub.getStatus() != null &&
            !List.of(RestaurantSubscription.Status.EXPIRED, RestaurantSubscription.Status.CANCELED).contains(sub.getStatus())) {
            throw SubscriptionException.invalidStateTransition(
                "Cannot start trial from " + sub.getStatus() + " status", restaurantId);
        }

        // Check if subscription is suspended
        if (sub.getStatus() == RestaurantSubscription.Status.SUSPENDED) {
            throw SubscriptionException.cannotStartTrialWhileSuspended(restaurantId);
        }

        LocalDateTime now = LocalDateTime.now();
        sub.setTrialStartAt(now);
        sub.setTrialEndAt(now.plusDays(trialDays));
        sub.setStatus(RestaurantSubscription.Status.TRIALING);

        // Clear any previous cancellation flags
        sub.setCancelAtPeriodEnd(false);
        sub.setCanceledAt(null);

        sub = subscriptionRepository.save(sub);

        // Log trial start event with metadata
        String metadata = String.format("{\"trialDays\":%d,\"trialEndAt\":\"%s\"}",
            trialDays, sub.getTrialEndAt());
        eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), "TRIAL_STARTED", metadata));

        // During trial, grant PRO entitlements
        setRestaurantPlan(restaurantId, Restaurant.SubscriptionPlan.PRO);
        return sub;
    }

    // Admin: directly set trial days
    @Transactional
    public RestaurantSubscription setTrialDays(Long restaurantId, int days) {
        if (days <= 0) throw SubscriptionException.invalidParameters("Days must be > 0");

        // Validate restaurant exists
        if (!restaurantRepository.existsById(restaurantId)) {
            throw SubscriptionException.restaurantNotFound(restaurantId);
        }

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
        if (days <= 0) throw SubscriptionException.invalidParameters("Days must be > 0");

        // Validate restaurant exists
        if (!restaurantRepository.existsById(restaurantId)) {
            throw SubscriptionException.restaurantNotFound(restaurantId);
        }

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
        // Validate restaurant exists
        if (!restaurantRepository.existsById(restaurantId)) {
            throw SubscriptionException.restaurantNotFound(restaurantId);
        }

        RestaurantSubscription sub = ensureSubscription(restaurantId);

        // Validate current status allows suspension
        if (sub.getStatus() == RestaurantSubscription.Status.SUSPENDED) {
            throw SubscriptionException.alreadySuspended(restaurantId);
        }

        LocalDateTime now = LocalDateTime.now();

        // End any active/paid period and set to SUSPENDED to disable entitlements
        sub.setCurrentPeriodEndAt(now);
        sub.setStatus(RestaurantSubscription.Status.SUSPENDED);
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

    // Validate subscription data integrity
    @Transactional(readOnly = true)
    public void validateSubscriptionIntegrity(Long restaurantId) {
        if (!restaurantRepository.existsById(restaurantId)) {
            throw SubscriptionException.restaurantNotFound(restaurantId);
        }

        RestaurantSubscription sub = ensureSubscription(restaurantId);
        LocalDateTime now = LocalDateTime.now();

        // Validate date consistency
        if (sub.getTrialStartAt() != null && sub.getTrialEndAt() != null) {
            if (sub.getTrialStartAt().isAfter(sub.getTrialEndAt())) {
                throw SubscriptionException.invalidStateTransition(
                    "Trial start date cannot be after trial end date", restaurantId);
            }
        }

        if (sub.getCurrentPeriodStartAt() != null && sub.getCurrentPeriodEndAt() != null) {
            if (sub.getCurrentPeriodStartAt().isAfter(sub.getCurrentPeriodEndAt())) {
                throw SubscriptionException.invalidStateTransition(
                    "Current period start date cannot be after end date", restaurantId);
            }
        }

        if (sub.getGraceEndAt() != null) {
            // Grace period should be after trial or current period end
            LocalDateTime baseEndDate = sub.getCurrentPeriodEndAt() != null ?
                sub.getCurrentPeriodEndAt() : sub.getTrialEndAt();
            if (baseEndDate != null && sub.getGraceEndAt().isBefore(baseEndDate)) {
                throw SubscriptionException.invalidStateTransition(
                    "Grace end date cannot be before period end date", restaurantId);
            }
        }

        // Validate status consistency
        switch (sub.getStatus()) {
            case TRIALING:
                if (sub.getTrialEndAt() == null || sub.getTrialEndAt().isBefore(now)) {
                    throw SubscriptionException.invalidStateTransition(
                        "TRIALING status requires valid future trial end date", restaurantId);
                }
                break;
            case ACTIVE:
                if (sub.getCurrentPeriodEndAt() == null || sub.getCurrentPeriodEndAt().isBefore(now)) {
                    throw SubscriptionException.invalidStateTransition(
                        "ACTIVE status requires valid future period end date", restaurantId);
                }
                break;
            case GRACE:
                if (sub.getGraceEndAt() != null && sub.getGraceEndAt().isBefore(now)) {
                    throw SubscriptionException.invalidStateTransition(
                        "GRACE status with expired grace period", restaurantId);
                }
                break;
            case SUSPENDED:
                if (sub.getCanceledAt() == null) {
                    throw SubscriptionException.invalidStateTransition(
                        "SUSPENDED status requires canceled_at timestamp", restaurantId);
                }
                break;
            case EXPIRED:
            case CANCELED:
                // These statuses are valid without additional constraints
                break;
        }
    }

    // Sync subscription data between restaurant.subscription_plan and restaurant_subscriptions table
    @Transactional
    public void syncSubscriptionData(Long restaurantId) {
        if (!restaurantRepository.existsById(restaurantId)) {
            throw SubscriptionException.restaurantNotFound(restaurantId);
        }

        Restaurant restaurant = restaurantRepository.findById(restaurantId).get();
        RestaurantSubscription sub = ensureSubscription(restaurantId);

        // Determine the correct plan based on subscription validity
        boolean hasValidProSubscription = isValidProSubscription(restaurantId);
        Restaurant.SubscriptionPlan correctPlan = hasValidProSubscription ?
            Restaurant.SubscriptionPlan.PRO : Restaurant.SubscriptionPlan.BASIC;

        // Update restaurant plan if it doesn't match
        if (restaurant.getSubscriptionPlan() != correctPlan) {
            restaurant.setSubscriptionPlan(correctPlan);
            restaurantRepository.save(restaurant);

            // Log the sync operation
            String metadata = String.format(
                "{\"action\":\"sync\",\"oldPlan\":\"%s\",\"newPlan\":\"%s\",\"validPro\":%b}",
                restaurant.getSubscriptionPlan().name(), correctPlan.name(), hasValidProSubscription
            );
            eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), "PLAN_SYNC", metadata));
        }

        // Update subscription plan if it doesn't match
        RestaurantSubscription.Plan correctSubPlan = hasValidProSubscription ?
            RestaurantSubscription.Plan.PRO : RestaurantSubscription.Plan.BASIC;

        if (sub.getPlan() != correctSubPlan) {
            sub.setPlan(correctSubPlan);
            subscriptionRepository.save(sub);

            // Log the sync operation
            String metadata = String.format(
                "{\"action\":\"subscription_plan_sync\",\"oldPlan\":\"%s\",\"newPlan\":\"%s\"}",
                sub.getPlan().name(), correctSubPlan.name()
            );
            eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), "SUB_PLAN_SYNC", metadata));
        }
    }

    // Admin: unsuspend/reactivate subscription according to current timelines
    @Transactional
    public RestaurantSubscription unsuspend(Long restaurantId) {
        // Validate restaurant exists
        if (!restaurantRepository.existsById(restaurantId)) {
            throw SubscriptionException.restaurantNotFound(restaurantId);
        }

        RestaurantSubscription sub = ensureSubscription(restaurantId);

        // Validate current status allows unsuspension
        if (sub.getStatus() != RestaurantSubscription.Status.SUSPENDED) {
            throw SubscriptionException.notSuspended(restaurantId);
        }

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

    // Admin: cancel subscription (set to cancel at period end)
    @Transactional
    public RestaurantSubscription cancelSubscription(Long restaurantId) {
        // Validate restaurant exists
        if (!restaurantRepository.existsById(restaurantId)) {
            throw SubscriptionException.restaurantNotFound(restaurantId);
        }

        RestaurantSubscription sub = ensureSubscription(restaurantId);

        // Validate current status allows cancellation
        if (sub.getStatus() == RestaurantSubscription.Status.CANCELED ||
            sub.getStatus() == RestaurantSubscription.Status.EXPIRED ||
            sub.getStatus() == RestaurantSubscription.Status.SUSPENDED) {
            throw SubscriptionException.invalidStateTransition(
                "Cannot cancel subscription in " + sub.getStatus() + " status", restaurantId);
        }

        // Check if already set to cancel
        if (sub.getCancelAtPeriodEnd() != null && sub.getCancelAtPeriodEnd()) {
            throw SubscriptionException.invalidParameters("Subscription is already set to cancel at period end");
        }

        LocalDateTime now = LocalDateTime.now();

        // Set to cancel at period end
        sub.setCancelAtPeriodEnd(true);
        sub.setCanceledAt(now);

        sub = subscriptionRepository.save(sub);

        // Log cancellation event
        eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), "CANCELED",
            String.format("{\"canceledAt\":\"%s\",\"cancelAtPeriodEnd\":true}", now)));

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



    @Transactional
    public void setRestaurantPlan(Long restaurantId, Restaurant.SubscriptionPlan plan) {
        restaurantRepository.findById(restaurantId).ifPresent(r -> {
            if (r.getSubscriptionPlan() != plan) {
                r.setSubscriptionPlan(plan);
                restaurantRepository.save(r);
            }
        });
    }

    /**
     * Real-time validation of subscription status
     * This method checks if a restaurant currently has valid PRO access
     */
    public boolean isValidProSubscription(Long restaurantId) {
        try {
            RestaurantSubscription sub = ensureSubscription(restaurantId);
            LocalDateTime now = LocalDateTime.now();

            // Check if subscription is in a valid PRO state
            switch (sub.getStatus()) {
                case TRIALING:
                    return sub.getTrialEndAt() != null && now.isBefore(sub.getTrialEndAt());
                case ACTIVE:
                    return sub.getCurrentPeriodEndAt() != null && now.isBefore(sub.getCurrentPeriodEndAt());
                case GRACE:
                    // Check if still within grace period using graceEndAt if available
                    if (sub.getGraceEndAt() != null) {
                        return now.isBefore(sub.getGraceEndAt());
                    }
                    // Fallback to calculated grace period
                    int graceDays = platformSettingService.getIntegerSetting("SUB_GRACE_DAYS_DEFAULT", 3);
                    if (sub.getTrialEndAt() != null && sub.getCurrentPeriodEndAt() == null) {
                        return now.isBefore(sub.getTrialEndAt().plusDays(graceDays));
                    } else if (sub.getCurrentPeriodEndAt() != null) {
                        return now.isBefore(sub.getCurrentPeriodEndAt().plusDays(graceDays));
                    }
                    return false;
                case EXPIRED:
                case CANCELED:
                case SUSPENDED:
                default:
                    return false;
            }
        } catch (Exception e) {
            // Log error but don't fail - return false for safety
            System.err.println("Error validating subscription for restaurant " + restaurantId + ": " + e.getMessage());
            return false;
        }
    }

    /**
     * Audit and repair subscription inconsistencies
     * Returns a report of issues found and fixed
     */
    @Transactional
    public SubscriptionAuditReport auditAndRepairSubscriptions() {
        SubscriptionAuditReport report = new SubscriptionAuditReport();
        LocalDateTime now = LocalDateTime.now();

        List<RestaurantSubscription> allSubs = subscriptionRepository.findAll();

        for (RestaurantSubscription sub : allSubs) {
            Restaurant restaurant = restaurantRepository.findById(sub.getRestaurantId()).orElse(null);
            if (restaurant == null) {
                report.addOrphanedSubscription(sub.getId());
                continue;
            }

            boolean shouldBePro = isValidProSubscription(sub.getRestaurantId());
            boolean currentlyPro = restaurant.getSubscriptionPlan() == Restaurant.SubscriptionPlan.PRO;

            if (shouldBePro != currentlyPro) {
                // Fix the mismatch
                Restaurant.SubscriptionPlan correctPlan = shouldBePro ?
                    Restaurant.SubscriptionPlan.PRO : Restaurant.SubscriptionPlan.BASIC;
                setRestaurantPlan(sub.getRestaurantId(), correctPlan);

                report.addMismatchFixed(sub.getRestaurantId(), currentlyPro, shouldBePro);

                // Log the fix
                eventRepository.save(new RestaurantSubscriptionEvent(
                    sub.getId(),
                    "AUDIT_REPAIR",
                    String.format("{\"from\":\"%s\",\"to\":\"%s\",\"reason\":\"Plan mismatch repair\"}",
                        currentlyPro ? "PRO" : "BASIC",
                        shouldBePro ? "PRO" : "BASIC")
                ));
            }

            // Check for expired subscriptions that should be updated
            if (sub.getStatus() == RestaurantSubscription.Status.ACTIVE &&
                sub.getCurrentPeriodEndAt() != null &&
                now.isAfter(sub.getCurrentPeriodEndAt())) {

                int graceDays = platformSettingService.getIntegerSetting("SUB_GRACE_DAYS_DEFAULT", 3);
                if (now.isAfter(sub.getCurrentPeriodEndAt().plusDays(graceDays))) {
                    sub.setStatus(RestaurantSubscription.Status.EXPIRED);
                    subscriptionRepository.save(sub);
                    setRestaurantPlan(sub.getRestaurantId(), Restaurant.SubscriptionPlan.BASIC);

                    report.addExpiredSubscriptionFixed(sub.getRestaurantId());
                    eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), "AUDIT_EXPIRED", null));
                }
            }
        }

        return report;
    }

    /**
     * Force expire a subscription immediately (admin function)
     */
    @Transactional
    public RestaurantSubscription forceExpireSubscription(Long restaurantId, String reason) {
        RestaurantSubscription sub = ensureSubscription(restaurantId);
        LocalDateTime now = LocalDateTime.now();

        // Set to expired and end any active periods
        sub.setStatus(RestaurantSubscription.Status.EXPIRED);
        if (sub.getCurrentPeriodEndAt() == null || sub.getCurrentPeriodEndAt().isAfter(now)) {
            sub.setCurrentPeriodEndAt(now);
        }
        sub.setCancelAtPeriodEnd(true);
        sub.setCanceledAt(now);

        sub = subscriptionRepository.save(sub);

        // Downgrade to BASIC
        setRestaurantPlan(restaurantId, Restaurant.SubscriptionPlan.BASIC);

        // Log the action
        String metadata = reason != null ?
            String.format("{\"reason\":\"%s\"}", reason.replace("\"", "\\\"")) : null;
        eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), "FORCE_EXPIRED", metadata));

        return sub;
    }

    /**
     * Enhanced daily checks with better edge case handling
     */
    @Transactional
    public void runDailyChecks() {
        int graceDays = platformSettingService.getIntegerSetting("SUB_GRACE_DAYS_DEFAULT", 3);
        int notifyTrialBefore = platformSettingService.getIntegerSetting("SUB_NOTIFY_DAYS_BEFORE_TRIAL_END", 3);
        int notifyPeriodBefore = platformSettingService.getIntegerSetting("SUB_NOTIFY_DAYS_BEFORE_PERIOD_END", 5);
        LocalDateTime now = LocalDateTime.now();

        List<RestaurantSubscription> subs = subscriptionRepository.findAll();
        int processedCount = 0;
        int transitionsCount = 0;

        for (RestaurantSubscription sub : subs) {
            processedCount++;
            Restaurant restaurant = restaurantRepository.findById(sub.getRestaurantId()).orElse(null);
            if (restaurant == null) continue;
            Long ownerId = restaurant.getOwnerId();

            // Handle legacy ACTIVE subscriptions without end dates (should have been fixed by migration)
            if (sub.getStatus() == RestaurantSubscription.Status.ACTIVE &&
                sub.getCurrentPeriodEndAt() == null && sub.getTrialEndAt() == null) {

                sub.setStatus(RestaurantSubscription.Status.EXPIRED);
                subscriptionRepository.save(sub);
                setRestaurantPlan(sub.getRestaurantId(), Restaurant.SubscriptionPlan.BASIC);
                eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), "LEGACY_EXPIRED",
                    "{\"reason\":\"ACTIVE subscription without end date\"}"));
                transitionsCount++;
                continue;
            }

            // Trial reminders and transitions
            if (sub.getTrialEndAt() != null) {
                // Send trial reminder if still trialing
                if (sub.getStatus() == RestaurantSubscription.Status.TRIALING) {
                    LocalDateTime remindAt = sub.getTrialEndAt().minusDays(notifyTrialBefore);
                    if (!now.isBefore(remindAt) && now.isBefore(sub.getTrialEndAt())) {
                        notify(ownerId, sub.getRestaurantId(), "Trial ending soon",
                            "Your trial ends on " + sub.getTrialEndAt().toLocalDate() + ".",
                            Map.of("subscriptionId", sub.getId(), "phase", "TRIAL"));
                    }
                }

                // Handle trial expiration (only if no active paid period)
                if (!now.isBefore(sub.getTrialEndAt()) &&
                    (sub.getCurrentPeriodEndAt() == null || !now.isBefore(sub.getCurrentPeriodEndAt()))) {

                    LocalDateTime graceEnd = sub.getTrialEndAt().plusDays(graceDays);
                    if (now.isBefore(graceEnd)) {
                        if (sub.getStatus() != RestaurantSubscription.Status.GRACE) {
                            sub.setStatus(RestaurantSubscription.Status.GRACE);
                            sub.setGraceEndAt(graceEnd); // Set the grace end date
                            subscriptionRepository.save(sub);
                            eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), "TRIAL_GRACE_STARTED", null));
                            transitionsCount++;
                        }
                        setRestaurantPlan(sub.getRestaurantId(), Restaurant.SubscriptionPlan.PRO);
                    } else {
                        if (sub.getStatus() != RestaurantSubscription.Status.EXPIRED) {
                            sub.setStatus(RestaurantSubscription.Status.EXPIRED);
                            subscriptionRepository.save(sub);
                            eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), "TRIAL_EXPIRED", null));
                            setRestaurantPlan(sub.getRestaurantId(), Restaurant.SubscriptionPlan.BASIC);
                            notify(ownerId, sub.getRestaurantId(), "Trial expired", "Your trial has expired.",
                                Map.of("subscriptionId", sub.getId()));
                            transitionsCount++;
                        }
                    }
                }
            }

            // Paid subscription handling
            if (sub.getCurrentPeriodEndAt() != null) {
                // Send reminder before period ends
                if ((sub.getStatus() == RestaurantSubscription.Status.ACTIVE ||
                     sub.getStatus() == RestaurantSubscription.Status.GRACE)) {
                    LocalDateTime remindAt = sub.getCurrentPeriodEndAt().minusDays(notifyPeriodBefore);
                    if (!now.isBefore(remindAt) && now.isBefore(sub.getCurrentPeriodEndAt())) {
                        notify(ownerId, sub.getRestaurantId(), "Subscription ending soon",
                            "Your PRO period ends on " + sub.getCurrentPeriodEndAt().toLocalDate() + ".",
                            Map.of("subscriptionId", sub.getId(), "phase", "PAID"));
                    }
                }

                // Handle paid period expiration
                if (!now.isBefore(sub.getCurrentPeriodEndAt())) {
                    LocalDateTime graceEnd = sub.getCurrentPeriodEndAt().plusDays(graceDays);
                    if (now.isBefore(graceEnd)) {
                        if (sub.getStatus() != RestaurantSubscription.Status.GRACE) {
                            sub.setStatus(RestaurantSubscription.Status.GRACE);
                            sub.setGraceEndAt(graceEnd); // Set the grace end date
                            subscriptionRepository.save(sub);
                            eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), "PERIOD_GRACE_STARTED", null));
                            transitionsCount++;
                        }
                        setRestaurantPlan(sub.getRestaurantId(), Restaurant.SubscriptionPlan.PRO);
                    } else {
                        if (sub.getStatus() != RestaurantSubscription.Status.EXPIRED) {
                            sub.setStatus(RestaurantSubscription.Status.EXPIRED);
                            subscriptionRepository.save(sub);
                            eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), "SUBSCRIPTION_EXPIRED", null));
                            setRestaurantPlan(sub.getRestaurantId(), Restaurant.SubscriptionPlan.BASIC);
                            notify(ownerId, sub.getRestaurantId(), "Subscription expired",
                                "Your PRO subscription has expired.", Map.of("subscriptionId", sub.getId()));
                            transitionsCount++;
                        }
                    }
                }
            }

            // Ensure subscription plan consistency
            boolean shouldBePro = isValidProSubscription(sub.getRestaurantId());
            boolean currentlyPro = restaurant.getSubscriptionPlan() == Restaurant.SubscriptionPlan.PRO;

            if (shouldBePro != currentlyPro) {
                Restaurant.SubscriptionPlan correctPlan = shouldBePro ?
                    Restaurant.SubscriptionPlan.PRO : Restaurant.SubscriptionPlan.BASIC;
                setRestaurantPlan(sub.getRestaurantId(), correctPlan);
                eventRepository.save(new RestaurantSubscriptionEvent(sub.getId(), "DAILY_CHECK_SYNC",
                    String.format("{\"from\":\"%s\",\"to\":\"%s\"}",
                        currentlyPro ? "PRO" : "BASIC",
                        shouldBePro ? "PRO" : "BASIC")));
                transitionsCount++;
            }
        }

        // Log summary of daily check execution
        System.out.println(String.format("Daily subscription check completed: %d subscriptions processed, %d transitions made",
            processedCount, transitionsCount));
    }

    private void notify(Long userId, Long restaurantId, String title, String body, Map<String, Object> data) {
        try {
            notificationService.createNotification(userId, restaurantId, Notification.Type.GENERIC, title, body, data);
        } catch (Exception ignored) { }
    }
}
