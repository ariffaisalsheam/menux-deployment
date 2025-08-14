package com.menux.menu_x_backend.dto.analytics;

import java.time.LocalDateTime;
import java.util.List;

public class BasicAnalyticsDTO {
    
    private MetricData totalViews;
    private MetricData qrScans;
    private MetricData uniqueVisitors;
    private MetricData menuItems;
    private List<PopularItem> mostViewedItems;
    private List<DailyViewPoint> dailyViews;
    private List<MenuUpdateActivity> recentUpdates;
    private ViewDistribution viewDistribution;
    
    // Constructors
    public BasicAnalyticsDTO() {}
    
    public BasicAnalyticsDTO(MetricData totalViews, MetricData qrScans, MetricData uniqueVisitors, 
                           MetricData menuItems, List<PopularItem> mostViewedItems, 
                           List<DailyViewPoint> dailyViews, List<MenuUpdateActivity> recentUpdates,
                           ViewDistribution viewDistribution) {
        this.totalViews = totalViews;
        this.qrScans = qrScans;
        this.uniqueVisitors = uniqueVisitors;
        this.menuItems = menuItems;
        this.mostViewedItems = mostViewedItems;
        this.dailyViews = dailyViews;
        this.recentUpdates = recentUpdates;
        this.viewDistribution = viewDistribution;
    }
    
    // Metric data class for consistent change tracking
    public static class MetricData {
        private double current;
        private double previous;
        private double change;
        
        public MetricData() {}
        
        public MetricData(double current, double previous, double change) {
            this.current = current;
            this.previous = previous;
            this.change = change;
        }
        
        // Getters and Setters
        public double getCurrent() { return current; }
        public void setCurrent(double current) { this.current = current; }
        
        public double getPrevious() { return previous; }
        public void setPrevious(double previous) { this.previous = previous; }
        
        public double getChange() { return change; }
        public void setChange(double change) { this.change = change; }
    }
    
    // Popular menu item data
    public static class PopularItem {
        private Long menuItemId;
        private String itemName;
        private String category;
        private long viewCount;
        private double price;
        
        public PopularItem() {}
        
        public PopularItem(Long menuItemId, String itemName, String category, long viewCount, double price) {
            this.menuItemId = menuItemId;
            this.itemName = itemName;
            this.category = category;
            this.viewCount = viewCount;
            this.price = price;
        }
        
        // Getters and Setters
        public Long getMenuItemId() { return menuItemId; }
        public void setMenuItemId(Long menuItemId) { this.menuItemId = menuItemId; }
        
        public String getItemName() { return itemName; }
        public void setItemName(String itemName) { this.itemName = itemName; }
        
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        
        public long getViewCount() { return viewCount; }
        public void setViewCount(long viewCount) { this.viewCount = viewCount; }
        
        public double getPrice() { return price; }
        public void setPrice(double price) { this.price = price; }
    }
    
    // Daily view tracking
    public static class DailyViewPoint {
        private String date;
        private long views;
        private long scans;
        
        public DailyViewPoint() {}
        
        public DailyViewPoint(String date, long views, long scans) {
            this.date = date;
            this.views = views;
            this.scans = scans;
        }
        
        // Getters and Setters
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        
        public long getViews() { return views; }
        public void setViews(long views) { this.views = views; }
        
        public long getScans() { return scans; }
        public void setScans(long scans) { this.scans = scans; }
    }
    
    // Menu update activity
    public static class MenuUpdateActivity {
        private String itemName;
        private String action; // "CREATED", "UPDATED", "AVAILABILITY_CHANGED"
        private LocalDateTime timestamp;
        private String category;
        
        public MenuUpdateActivity() {}
        
        public MenuUpdateActivity(String itemName, String action, LocalDateTime timestamp, String category) {
            this.itemName = itemName;
            this.action = action;
            this.timestamp = timestamp;
            this.category = category;
        }
        
        // Getters and Setters
        public String getItemName() { return itemName; }
        public void setItemName(String itemName) { this.itemName = itemName; }
        
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
        
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
    }
    
    // View distribution by time
    public static class ViewDistribution {
        private List<HourlyData> hourlyData;
        private String peakHour;
        private long peakViews;
        
        public ViewDistribution() {}
        
        public ViewDistribution(List<HourlyData> hourlyData, String peakHour, long peakViews) {
            this.hourlyData = hourlyData;
            this.peakHour = peakHour;
            this.peakViews = peakViews;
        }
        
        public static class HourlyData {
            private int hour;
            private long views;
            
            public HourlyData() {}
            
            public HourlyData(int hour, long views) {
                this.hour = hour;
                this.views = views;
            }
            
            // Getters and Setters
            public int getHour() { return hour; }
            public void setHour(int hour) { this.hour = hour; }
            
            public long getViews() { return views; }
            public void setViews(long views) { this.views = views; }
        }
        
        // Getters and Setters
        public List<HourlyData> getHourlyData() { return hourlyData; }
        public void setHourlyData(List<HourlyData> hourlyData) { this.hourlyData = hourlyData; }
        
        public String getPeakHour() { return peakHour; }
        public void setPeakHour(String peakHour) { this.peakHour = peakHour; }
        
        public long getPeakViews() { return peakViews; }
        public void setPeakViews(long peakViews) { this.peakViews = peakViews; }
    }
    
    // Main class getters and setters
    public MetricData getTotalViews() { return totalViews; }
    public void setTotalViews(MetricData totalViews) { this.totalViews = totalViews; }
    
    public MetricData getQrScans() { return qrScans; }
    public void setQrScans(MetricData qrScans) { this.qrScans = qrScans; }
    
    public MetricData getUniqueVisitors() { return uniqueVisitors; }
    public void setUniqueVisitors(MetricData uniqueVisitors) { this.uniqueVisitors = uniqueVisitors; }
    
    public MetricData getMenuItems() { return menuItems; }
    public void setMenuItems(MetricData menuItems) { this.menuItems = menuItems; }
    
    public List<PopularItem> getMostViewedItems() { return mostViewedItems; }
    public void setMostViewedItems(List<PopularItem> mostViewedItems) { this.mostViewedItems = mostViewedItems; }
    
    public List<DailyViewPoint> getDailyViews() { return dailyViews; }
    public void setDailyViews(List<DailyViewPoint> dailyViews) { this.dailyViews = dailyViews; }
    
    public List<MenuUpdateActivity> getRecentUpdates() { return recentUpdates; }
    public void setRecentUpdates(List<MenuUpdateActivity> recentUpdates) { this.recentUpdates = recentUpdates; }
    
    public ViewDistribution getViewDistribution() { return viewDistribution; }
    public void setViewDistribution(ViewDistribution viewDistribution) { this.viewDistribution = viewDistribution; }
}
