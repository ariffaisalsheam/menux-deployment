package com.menux.menu_x_backend.dto.admin;

public class PlatformAnalyticsDTO {
    private Long totalUsers;
    private Long totalRestaurants;
    private Long proSubscriptions;
    private Long basicSubscriptions;
    private Double monthlyRevenue;
    private Long activeUsers;
    private Double systemHealth;
    private Long totalOrders;
    private Double conversionRate;

    // Constructors
    public PlatformAnalyticsDTO() {}

    public PlatformAnalyticsDTO(Long totalUsers, Long totalRestaurants, Long proSubscriptions, 
                               Long basicSubscriptions, Double monthlyRevenue, Long activeUsers, 
                               Double systemHealth, Long totalOrders, Double conversionRate) {
        this.totalUsers = totalUsers;
        this.totalRestaurants = totalRestaurants;
        this.proSubscriptions = proSubscriptions;
        this.basicSubscriptions = basicSubscriptions;
        this.monthlyRevenue = monthlyRevenue;
        this.activeUsers = activeUsers;
        this.systemHealth = systemHealth;
        this.totalOrders = totalOrders;
        this.conversionRate = conversionRate;
    }

    // Getters and Setters
    public Long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(Long totalUsers) { this.totalUsers = totalUsers; }

    public Long getTotalRestaurants() { return totalRestaurants; }
    public void setTotalRestaurants(Long totalRestaurants) { this.totalRestaurants = totalRestaurants; }

    public Long getProSubscriptions() { return proSubscriptions; }
    public void setProSubscriptions(Long proSubscriptions) { this.proSubscriptions = proSubscriptions; }

    public Long getBasicSubscriptions() { return basicSubscriptions; }
    public void setBasicSubscriptions(Long basicSubscriptions) { this.basicSubscriptions = basicSubscriptions; }

    public Double getMonthlyRevenue() { return monthlyRevenue; }
    public void setMonthlyRevenue(Double monthlyRevenue) { this.monthlyRevenue = monthlyRevenue; }

    public Long getActiveUsers() { return activeUsers; }
    public void setActiveUsers(Long activeUsers) { this.activeUsers = activeUsers; }

    public Double getSystemHealth() { return systemHealth; }
    public void setSystemHealth(Double systemHealth) { this.systemHealth = systemHealth; }

    public Long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(Long totalOrders) { this.totalOrders = totalOrders; }

    public Double getConversionRate() { return conversionRate; }
    public void setConversionRate(Double conversionRate) { this.conversionRate = conversionRate; }
}
