package com.menux.menu_x_backend.dto.admin;

import com.menux.menu_x_backend.entity.Restaurant;

public class UpdateUserPlanRequest {
    private Restaurant.SubscriptionPlan subscriptionPlan;

    // Constructors
    public UpdateUserPlanRequest() {}

    public UpdateUserPlanRequest(Restaurant.SubscriptionPlan subscriptionPlan) {
        this.subscriptionPlan = subscriptionPlan;
    }

    // Getters and Setters
    public Restaurant.SubscriptionPlan getSubscriptionPlan() { return subscriptionPlan; }
    public void setSubscriptionPlan(Restaurant.SubscriptionPlan subscriptionPlan) { this.subscriptionPlan = subscriptionPlan; }
}
