package com.menux.menu_x_backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@jakarta.persistence.Table(name = "menu_views")
public class MenuView {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;
    
    @Column(name = "menu_item_id")
    private Long menuItemId; // null for general menu views
    
    @Column(name = "visitor_ip")
    private String visitorIp;
    
    @Column(name = "user_agent")
    private String userAgent;
    
    @Column(name = "table_number")
    private String tableNumber;
    
    @Column(name = "view_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private ViewType viewType;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    public enum ViewType {
        MENU_SCAN,      // QR code scan to view menu
        ITEM_VIEW,      // Specific menu item viewed
        CATEGORY_VIEW   // Category browsed
    }
    
    // Constructors
    public MenuView() {
        this.createdAt = LocalDateTime.now();
    }
    
    public MenuView(Long restaurantId, ViewType viewType) {
        this();
        this.restaurantId = restaurantId;
        this.viewType = viewType;
    }
    
    public MenuView(Long restaurantId, Long menuItemId, ViewType viewType) {
        this(restaurantId, viewType);
        this.menuItemId = menuItemId;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }
    
    public Long getMenuItemId() { return menuItemId; }
    public void setMenuItemId(Long menuItemId) { this.menuItemId = menuItemId; }
    
    public String getVisitorIp() { return visitorIp; }
    public void setVisitorIp(String visitorIp) { this.visitorIp = visitorIp; }
    
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    
    public String getTableNumber() { return tableNumber; }
    public void setTableNumber(String tableNumber) { this.tableNumber = tableNumber; }
    
    public ViewType getViewType() { return viewType; }
    public void setViewType(ViewType viewType) { this.viewType = viewType; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
