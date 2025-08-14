package com.menux.menu_x_backend.dto.qr;

import com.menux.menu_x_backend.entity.QRCustomizationSettings;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class QRCustomizationSettingsDTO {
    
    private Long id;
    
    @NotNull(message = "Size is required")
    @Min(value = 128, message = "Size must be at least 128")
    @Max(value = 1024, message = "Size must not exceed 1024")
    private Integer size;
    
    @NotNull(message = "Branded setting is required")
    private Boolean branded;
    
    @NotNull(message = "Restaurant name display setting is required")
    private String restaurantNameDisplay; // 'full', 'abbreviated', 'hidden'
    
    @NotNull(message = "Table name format is required")
    private String tableNameFormat; // 'table-number', 'short', 'number-only'
    
    @NotNull(message = "Font size is required")
    private String fontSize; // 'small', 'medium', 'large'
    
    @NotNull(message = "Text position is required")
    private String textPosition; // 'top', 'bottom'
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructors
    public QRCustomizationSettingsDTO() {}
    
    public QRCustomizationSettingsDTO(QRCustomizationSettings settings) {
        this.id = settings.getId();
        this.size = settings.getSize();
        this.branded = settings.getBranded();
        this.restaurantNameDisplay = settings.getRestaurantNameDisplay().name().toLowerCase().replace("_", "-");
        this.tableNameFormat = settings.getTableNameFormat().name().toLowerCase().replace("_", "-");
        this.fontSize = settings.getFontSize().name().toLowerCase();
        this.textPosition = settings.getTextPosition().name().toLowerCase();
        this.createdAt = settings.getCreatedAt();
        this.updatedAt = settings.getUpdatedAt();
    }
    
    // Convert DTO to Entity
    public QRCustomizationSettings toEntity(Long restaurantId) {
        QRCustomizationSettings settings = new QRCustomizationSettings(restaurantId);
        settings.setSize(this.size);
        settings.setBranded(this.branded);
        
        // Convert string values to enums
        settings.setRestaurantNameDisplay(parseRestaurantNameDisplay(this.restaurantNameDisplay));
        settings.setTableNameFormat(parseTableNameFormat(this.tableNameFormat));
        settings.setFontSize(parseFontSize(this.fontSize));
        settings.setTextPosition(parseTextPosition(this.textPosition));
        
        return settings;
    }
    
    // Update existing entity with DTO values
    public void updateEntity(QRCustomizationSettings settings) {
        settings.setSize(this.size);
        settings.setBranded(this.branded);
        settings.setRestaurantNameDisplay(parseRestaurantNameDisplay(this.restaurantNameDisplay));
        settings.setTableNameFormat(parseTableNameFormat(this.tableNameFormat));
        settings.setFontSize(parseFontSize(this.fontSize));
        settings.setTextPosition(parseTextPosition(this.textPosition));
    }
    
    // Helper methods to parse string values to enums
    private QRCustomizationSettings.RestaurantNameDisplay parseRestaurantNameDisplay(String value) {
        switch (value.toLowerCase()) {
            case "full":
                return QRCustomizationSettings.RestaurantNameDisplay.FULL;
            case "abbreviated":
                return QRCustomizationSettings.RestaurantNameDisplay.ABBREVIATED;
            case "hidden":
                return QRCustomizationSettings.RestaurantNameDisplay.HIDDEN;
            default:
                return QRCustomizationSettings.RestaurantNameDisplay.FULL;
        }
    }
    
    private QRCustomizationSettings.TableNameFormat parseTableNameFormat(String value) {
        switch (value.toLowerCase()) {
            case "table-number":
                return QRCustomizationSettings.TableNameFormat.TABLE_NUMBER;
            case "short":
                return QRCustomizationSettings.TableNameFormat.SHORT;
            case "number-only":
                return QRCustomizationSettings.TableNameFormat.NUMBER_ONLY;
            default:
                return QRCustomizationSettings.TableNameFormat.TABLE_NUMBER;
        }
    }
    
    private QRCustomizationSettings.FontSize parseFontSize(String value) {
        switch (value.toLowerCase()) {
            case "small":
                return QRCustomizationSettings.FontSize.SMALL;
            case "medium":
                return QRCustomizationSettings.FontSize.MEDIUM;
            case "large":
                return QRCustomizationSettings.FontSize.LARGE;
            default:
                return QRCustomizationSettings.FontSize.MEDIUM;
        }
    }
    
    private QRCustomizationSettings.TextPosition parseTextPosition(String value) {
        switch (value.toLowerCase()) {
            case "top":
                return QRCustomizationSettings.TextPosition.TOP;
            case "bottom":
                return QRCustomizationSettings.TextPosition.BOTTOM;
            default:
                return QRCustomizationSettings.TextPosition.BOTTOM;
        }
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Integer getSize() { return size; }
    public void setSize(Integer size) { this.size = size; }
    
    public Boolean getBranded() { return branded; }
    public void setBranded(Boolean branded) { this.branded = branded; }
    
    public String getRestaurantNameDisplay() { return restaurantNameDisplay; }
    public void setRestaurantNameDisplay(String restaurantNameDisplay) { 
        this.restaurantNameDisplay = restaurantNameDisplay; 
    }
    
    public String getTableNameFormat() { return tableNameFormat; }
    public void setTableNameFormat(String tableNameFormat) { 
        this.tableNameFormat = tableNameFormat; 
    }
    
    public String getFontSize() { return fontSize; }
    public void setFontSize(String fontSize) { this.fontSize = fontSize; }
    
    public String getTextPosition() { return textPosition; }
    public void setTextPosition(String textPosition) { this.textPosition = textPosition; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
