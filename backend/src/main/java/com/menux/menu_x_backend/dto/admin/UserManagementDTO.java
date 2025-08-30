package com.menux.menu_x_backend.dto.admin;

import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.entity.Restaurant;

import java.time.LocalDateTime;

public class UserManagementDTO {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phoneNumber;
    private User.Role role;
    private String restaurantName;
    private Restaurant.SubscriptionPlan subscriptionPlan;
    private String status;
    private LocalDateTime joinDate;
    private LocalDateTime lastLogin;
    private Long restaurantId;

    // Constructors
    public UserManagementDTO() {}

    public UserManagementDTO(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.phoneNumber = user.getPhoneNumber();
        this.role = user.getRole();
        this.status = user.getIsActive() ? "active" : "inactive"; // Use actual user status
        this.joinDate = user.getCreatedAt();
        this.lastLogin = user.getUpdatedAt(); // Using updatedAt as proxy for last login

        // Restaurant data will be set separately using setters
    }

    public UserManagementDTO(User user, Restaurant restaurant) {
        this(user);
        if (restaurant != null) {
            this.restaurantId = restaurant.getId();
            this.restaurantName = restaurant.getName();
            this.subscriptionPlan = restaurant.getSubscriptionPlan();
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public User.Role getRole() { return role; }
    public void setRole(User.Role role) { this.role = role; }

    public String getRestaurantName() { return restaurantName; }
    public void setRestaurantName(String restaurantName) { this.restaurantName = restaurantName; }

    public Restaurant.SubscriptionPlan getSubscriptionPlan() { return subscriptionPlan; }
    public void setSubscriptionPlan(Restaurant.SubscriptionPlan subscriptionPlan) { this.subscriptionPlan = subscriptionPlan; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getJoinDate() { return joinDate; }
    public void setJoinDate(LocalDateTime joinDate) { this.joinDate = joinDate; }

    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }

    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }
}
