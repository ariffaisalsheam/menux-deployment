package com.menux.menu_x_backend.dto.subscription;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

import com.menux.menu_x_backend.entity.RestaurantSubscription;

public class RestaurantSubscriptionDTO {
    public Long id;
    public Long restaurantId;
    public String plan;
    public String status;
    public String trialStartAt;
    public String trialEndAt;
    public String currentPeriodStartAt;
    public String currentPeriodEndAt;
    public String graceEndAt;
    public Boolean cancelAtPeriodEnd;
    public String canceledAt;

    // Derived
    public Long trialDaysRemaining;
    public Long paidDaysRemaining;
    public Long graceDaysRemaining;

    public static RestaurantSubscriptionDTO from(RestaurantSubscription s) {
        RestaurantSubscriptionDTO d = new RestaurantSubscriptionDTO();
        d.id = s.getId();
        d.restaurantId = s.getRestaurantId();
        d.plan = s.getPlan() != null ? s.getPlan().name() : null;
        d.status = s.getStatus() != null ? s.getStatus().name() : null;
        d.trialStartAt = toIso(s.getTrialStartAt());
        d.trialEndAt = toIso(s.getTrialEndAt());
        d.currentPeriodStartAt = toIso(s.getCurrentPeriodStartAt());
        d.currentPeriodEndAt = toIso(s.getCurrentPeriodEndAt());
        d.graceEndAt = toIso(s.getGraceEndAt());
        d.cancelAtPeriodEnd = s.getCancelAtPeriodEnd();
        d.canceledAt = toIso(s.getCanceledAt());

        LocalDate today = LocalDate.now();
        if (s.getTrialEndAt() != null) {
            LocalDate end = s.getTrialEndAt().toLocalDate();
            d.trialDaysRemaining = end.isAfter(today) ? ChronoUnit.DAYS.between(today, end) : 0L;
        } else d.trialDaysRemaining = null;
        if (s.getCurrentPeriodEndAt() != null) {
            LocalDate end = s.getCurrentPeriodEndAt().toLocalDate();
            d.paidDaysRemaining = end.isAfter(today) ? ChronoUnit.DAYS.between(today, end) : 0L;
        } else d.paidDaysRemaining = null;
        if (s.getGraceEndAt() != null) {
            LocalDate end = s.getGraceEndAt().toLocalDate();
            d.graceDaysRemaining = end.isAfter(today) ? ChronoUnit.DAYS.between(today, end) : 0L;
        } else d.graceDaysRemaining = null;
        return d;
    }

    private static String toIso(LocalDateTime t) {
        return t == null ? null : t.toString();
    }
}
