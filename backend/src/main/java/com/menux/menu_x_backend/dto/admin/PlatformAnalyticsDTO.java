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
    
    // Trend data (percentage changes from previous period)
    private Double totalUsersChange;
    private Double totalRestaurantsChange;
    private Double proSubscriptionsChange;
    private Double monthlyRevenueChange;
    private Double activeUsersChange;

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

    public PlatformAnalyticsDTO(Long totalUsers, Long totalRestaurants, Long proSubscriptions, 
                               Long basicSubscriptions, Double monthlyRevenue, Long activeUsers, 
                               Double systemHealth, Long totalOrders, Double conversionRate,
                               Double totalUsersChange, Double totalRestaurantsChange, 
                               Double proSubscriptionsChange, Double monthlyRevenueChange, 
                               Double activeUsersChange) {
        this(totalUsers, totalRestaurants, proSubscriptions, basicSubscriptions, monthlyRevenue, 
             activeUsers, systemHealth, totalOrders, conversionRate);
        this.totalUsersChange = totalUsersChange;
        this.totalRestaurantsChange = totalRestaurantsChange;
        this.proSubscriptionsChange = proSubscriptionsChange;
        this.monthlyRevenueChange = monthlyRevenueChange;
        this.activeUsersChange = activeUsersChange;
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

    // Trend data getters and setters
    public Double getTotalUsersChange() { return totalUsersChange; }
    public void setTotalUsersChange(Double totalUsersChange) { this.totalUsersChange = totalUsersChange; }

    public Double getTotalRestaurantsChange() { return totalRestaurantsChange; }
    public void setTotalRestaurantsChange(Double totalRestaurantsChange) { this.totalRestaurantsChange = totalRestaurantsChange; }

    public Double getProSubscriptionsChange() { return proSubscriptionsChange; }
    public void setProSubscriptionsChange(Double proSubscriptionsChange) { this.proSubscriptionsChange = proSubscriptionsChange; }

    public Double getMonthlyRevenueChange() { return monthlyRevenueChange; }
    public void setMonthlyRevenueChange(Double monthlyRevenueChange) { this.monthlyRevenueChange = monthlyRevenueChange; }

    public Double getActiveUsersChange() { return activeUsersChange; }
    public void setActiveUsersChange(Double activeUsersChange) { this.activeUsersChange = activeUsersChange; }
}
