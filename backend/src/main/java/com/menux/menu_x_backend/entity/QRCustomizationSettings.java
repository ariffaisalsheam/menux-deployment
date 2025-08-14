package com.menux.menu_x_backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@jakarta.persistence.Table(name = "qr_customization_settings")
public class QRCustomizationSettings {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull(message = "Restaurant ID is required")
    @Column(name = "restaurant_id", nullable = false, unique = true)
    private Long restaurantId;
    
    @Column(name = "size", nullable = false)
    private Integer size = 256;
    
    @Column(name = "branded", nullable = false)
    private Boolean branded = false;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "restaurant_name_display", nullable = false)
    private RestaurantNameDisplay restaurantNameDisplay = RestaurantNameDisplay.FULL;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "table_name_format", nullable = false)
    private TableNameFormat tableNameFormat = TableNameFormat.TABLE_NUMBER;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "font_size", nullable = false)
    private FontSize fontSize = FontSize.MEDIUM;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "text_position", nullable = false)
    private TextPosition textPosition = TextPosition.BOTTOM;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum RestaurantNameDisplay {
        FULL, ABBREVIATED, HIDDEN
    }
    
    public enum TableNameFormat {
        TABLE_NUMBER, SHORT, NUMBER_ONLY
    }
    
    public enum FontSize {
        SMALL, MEDIUM, LARGE
    }
    
    public enum TextPosition {
        TOP, BOTTOM
    }
    
    // Constructors
    public QRCustomizationSettings() {}
    
    public QRCustomizationSettings(Long restaurantId) {
        this.restaurantId = restaurantId;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    // Lifecycle callbacks
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }
    
    public Integer getSize() { return size; }
    public void setSize(Integer size) { this.size = size; }
    
    public Boolean getBranded() { return branded; }
    public void setBranded(Boolean branded) { this.branded = branded; }
    
    public RestaurantNameDisplay getRestaurantNameDisplay() { return restaurantNameDisplay; }
    public void setRestaurantNameDisplay(RestaurantNameDisplay restaurantNameDisplay) { 
        this.restaurantNameDisplay = restaurantNameDisplay; 
    }
    
    public TableNameFormat getTableNameFormat() { return tableNameFormat; }
    public void setTableNameFormat(TableNameFormat tableNameFormat) { 
        this.tableNameFormat = tableNameFormat; 
    }
    
    public FontSize getFontSize() { return fontSize; }
    public void setFontSize(FontSize fontSize) { this.fontSize = fontSize; }
    
    public TextPosition getTextPosition() { return textPosition; }
    public void setTextPosition(TextPosition textPosition) { this.textPosition = textPosition; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    // Helper methods
    public String getFormattedTableName(String tableNumber) {
        switch (tableNameFormat) {
            case TABLE_NUMBER:
                return "Table " + tableNumber;
            case SHORT:
                return "T" + tableNumber;
            case NUMBER_ONLY:
                return tableNumber;
            default:
                return "Table " + tableNumber;
        }
    }
    
    public int getFontSizePixels() {
        switch (fontSize) {
            case SMALL:
                return 12;
            case MEDIUM:
                return 16;
            case LARGE:
                return 20;
            default:
                return 16;
        }
    }
    
    public String getFormattedRestaurantName(String restaurantName) {
        switch (restaurantNameDisplay) {
            case FULL:
                return restaurantName;
            case ABBREVIATED:
                // Take first letter of each word
                String[] words = restaurantName.split("\\s+");
                StringBuilder abbreviated = new StringBuilder();
                for (String word : words) {
                    if (!word.isEmpty()) {
                        abbreviated.append(word.charAt(0));
                    }
                }
                return abbreviated.toString().toUpperCase();
            case HIDDEN:
                return "";
            default:
                return restaurantName;
        }
    }
}
