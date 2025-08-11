package com.menux.menu_x_backend.dto.analytics;

import java.util.List;

public class RestaurantAnalyticsDTO {
    private MetricData revenue;
    private MetricData orders;
    private MetricData customers;
    private MetricData rating;
    private List<TopSellingItem> topSellingItems;
    private List<WeeklyTrend> weeklyTrends;
    private Long liveOrders;

    // Constructors
    public RestaurantAnalyticsDTO() {}

    public RestaurantAnalyticsDTO(MetricData revenue, MetricData orders, MetricData customers, 
                                 MetricData rating, List<TopSellingItem> topSellingItems, 
                                 List<WeeklyTrend> weeklyTrends, Long liveOrders) {
        this.revenue = revenue;
        this.orders = orders;
        this.customers = customers;
        this.rating = rating;
        this.topSellingItems = topSellingItems;
        this.weeklyTrends = weeklyTrends;
        this.liveOrders = liveOrders;
    }

    // Getters and Setters
    public MetricData getRevenue() { return revenue; }
    public void setRevenue(MetricData revenue) { this.revenue = revenue; }

    public MetricData getOrders() { return orders; }
    public void setOrders(MetricData orders) { this.orders = orders; }

    public MetricData getCustomers() { return customers; }
    public void setCustomers(MetricData customers) { this.customers = customers; }

    public MetricData getRating() { return rating; }
    public void setRating(MetricData rating) { this.rating = rating; }

    public List<TopSellingItem> getTopSellingItems() { return topSellingItems; }
    public void setTopSellingItems(List<TopSellingItem> topSellingItems) { this.topSellingItems = topSellingItems; }

    public List<WeeklyTrend> getWeeklyTrends() { return weeklyTrends; }
    public void setWeeklyTrends(List<WeeklyTrend> weeklyTrends) { this.weeklyTrends = weeklyTrends; }

    public Long getLiveOrders() { return liveOrders; }
    public void setLiveOrders(Long liveOrders) { this.liveOrders = liveOrders; }

    // Inner classes
    public static class MetricData {
        private Double current;
        private Double previous;
        private Double change;

        public MetricData() {}

        public MetricData(Double current, Double previous, Double change) {
            this.current = current;
            this.previous = previous;
            this.change = change;
        }

        public Double getCurrent() { return current; }
        public void setCurrent(Double current) { this.current = current; }

        public Double getPrevious() { return previous; }
        public void setPrevious(Double previous) { this.previous = previous; }

        public Double getChange() { return change; }
        public void setChange(Double change) { this.change = change; }
    }

    public static class TopSellingItem {
        private String name;
        private Long orders;
        private Double revenue;

        public TopSellingItem() {}

        public TopSellingItem(String name, Long orders, Double revenue) {
            this.name = name;
            this.orders = orders;
            this.revenue = revenue;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public Long getOrders() { return orders; }
        public void setOrders(Long orders) { this.orders = orders; }

        public Double getRevenue() { return revenue; }
        public void setRevenue(Double revenue) { this.revenue = revenue; }
    }

    public static class WeeklyTrend {
        private String period;
        private Double revenue;
        private Long orders;
        private Double change;

        public WeeklyTrend() {}

        public WeeklyTrend(String period, Double revenue, Long orders, Double change) {
            this.period = period;
            this.revenue = revenue;
            this.orders = orders;
            this.change = change;
        }

        public String getPeriod() { return period; }
        public void setPeriod(String period) { this.period = period; }

        public Double getRevenue() { return revenue; }
        public void setRevenue(Double revenue) { this.revenue = revenue; }

        public Long getOrders() { return orders; }
        public void setOrders(Long orders) { this.orders = orders; }

        public Double getChange() { return change; }
        public void setChange(Double change) { this.change = change; }
    }
}
