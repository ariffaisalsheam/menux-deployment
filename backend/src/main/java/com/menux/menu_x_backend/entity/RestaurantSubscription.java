package com.menux.menu_x_backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

@Entity
@jakarta.persistence.Table(name = "restaurant_subscriptions")
public class RestaurantSubscription {

    public enum Plan { BASIC, PRO }
    public enum Status { TRIALING, ACTIVE, GRACE, EXPIRED, CANCELED, SUSPENDED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false, unique = true)
    private Long restaurantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan", nullable = false)
    private Plan plan = Plan.PRO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status;

    @Column(name = "trial_start_at")
    private LocalDateTime trialStartAt;

    @Column(name = "trial_end_at")
    private LocalDateTime trialEndAt;

    @Column(name = "current_period_start_at")
    private LocalDateTime currentPeriodStartAt;

    @Column(name = "current_period_end_at")
    private LocalDateTime currentPeriodEndAt;

    @Column(name = "grace_end_at")
    private LocalDateTime graceEndAt;

    @Column(name = "cancel_at_period_end", nullable = false)
    private Boolean cancelAtPeriodEnd = false;

    @Column(name = "canceled_at")
    private LocalDateTime canceledAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and setters
    public Long getId() { return id; }
    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }

    public Plan getPlan() { return plan; }
    public void setPlan(Plan plan) { this.plan = plan; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public LocalDateTime getTrialStartAt() { return trialStartAt; }
    public void setTrialStartAt(LocalDateTime trialStartAt) { this.trialStartAt = trialStartAt; }

    public LocalDateTime getTrialEndAt() { return trialEndAt; }
    public void setTrialEndAt(LocalDateTime trialEndAt) { this.trialEndAt = trialEndAt; }

    public LocalDateTime getCurrentPeriodStartAt() { return currentPeriodStartAt; }
    public void setCurrentPeriodStartAt(LocalDateTime currentPeriodStartAt) { this.currentPeriodStartAt = currentPeriodStartAt; }

    public LocalDateTime getCurrentPeriodEndAt() { return currentPeriodEndAt; }
    public void setCurrentPeriodEndAt(LocalDateTime currentPeriodEndAt) { this.currentPeriodEndAt = currentPeriodEndAt; }

    public LocalDateTime getGraceEndAt() { return graceEndAt; }
    public void setGraceEndAt(LocalDateTime graceEndAt) { this.graceEndAt = graceEndAt; }

    public Boolean getCancelAtPeriodEnd() { return cancelAtPeriodEnd; }
    public void setCancelAtPeriodEnd(Boolean cancelAtPeriodEnd) { this.cancelAtPeriodEnd = cancelAtPeriodEnd; }

    public LocalDateTime getCanceledAt() { return canceledAt; }
    public void setCanceledAt(LocalDateTime canceledAt) { this.canceledAt = canceledAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
