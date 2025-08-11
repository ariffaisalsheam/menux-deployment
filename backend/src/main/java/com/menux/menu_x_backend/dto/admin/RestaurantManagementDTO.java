package com.menux.menu_x_backend.dto.admin;

import com.menux.menu_x_backend.entity.Restaurant;

import java.time.LocalDateTime;

public class RestaurantManagementDTO {
    private Long id;
    private String name;
    private String description;
    private String address;
    private String phone;
    private String email;
    private Restaurant.SubscriptionPlan subscriptionPlan;
    private String status;
    private LocalDateTime joinDate;
    private String ownerName;
    private String ownerEmail;
    private Long totalOrders;
    private Double monthlyRevenue;

    // Constructors
    public RestaurantManagementDTO() {}

    public RestaurantManagementDTO(Restaurant restaurant) {
        this.id = restaurant.getId();
        this.name = restaurant.getName();
        this.description = restaurant.getDescription();
        this.address = restaurant.getAddress();
        this.phone = restaurant.getPhoneNumber();
        this.email = restaurant.getEmail();
        this.subscriptionPlan = restaurant.getSubscriptionPlan();
        this.status = "active"; // Default status
        this.joinDate = restaurant.getCreatedAt();
        
        if (restaurant.getOwner() != null) {
            this.ownerName = restaurant.getOwner().getFullName();
            this.ownerEmail = restaurant.getOwner().getEmail();
        }
        
        // These would be calculated from actual order data
        this.totalOrders = 0L; // TODO: Calculate from orders
        this.monthlyRevenue = 0.0; // TODO: Calculate from orders
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Restaurant.SubscriptionPlan getSubscriptionPlan() { return subscriptionPlan; }
    public void setSubscriptionPlan(Restaurant.SubscriptionPlan subscriptionPlan) { this.subscriptionPlan = subscriptionPlan; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getJoinDate() { return joinDate; }
    public void setJoinDate(LocalDateTime joinDate) { this.joinDate = joinDate; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public String getOwnerEmail() { return ownerEmail; }
    public void setOwnerEmail(String ownerEmail) { this.ownerEmail = ownerEmail; }

    public Long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(Long totalOrders) { this.totalOrders = totalOrders; }

    public Double getMonthlyRevenue() { return monthlyRevenue; }
    public void setMonthlyRevenue(Double monthlyRevenue) { this.monthlyRevenue = monthlyRevenue; }
}
