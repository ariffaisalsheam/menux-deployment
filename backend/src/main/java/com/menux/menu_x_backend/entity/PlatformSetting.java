package com.menux.menu_x_backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

@Entity
@jakarta.persistence.Table(name = "platform_settings")
public class PlatformSetting {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Setting key is required")
    @Size(max = 100, message = "Setting key must not exceed 100 characters")
    @Column(name = "setting_key", nullable = false, unique = true)
    private String key;
    
    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String value;
    
    @Size(max = 255, message = "Description must not exceed 255 characters")
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "value_type", nullable = false)
    private ValueType valueType = ValueType.STRING;
    
    @Column(name = "is_public", nullable = false)
    private Boolean isPublic = false; // Whether this setting can be accessed by non-admin users
    
    @Column(name = "is_system", nullable = false)
    private Boolean isSystem = false; // Whether this is a system setting that shouldn't be deleted
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum ValueType {
        STRING, INTEGER, BOOLEAN, DECIMAL, JSON
    }
    
    // Constructors
    public PlatformSetting() {}
    
    public PlatformSetting(String key, String value, ValueType valueType) {
        this.key = key;
        this.value = value;
        this.valueType = valueType;
        this.createdAt = LocalDateTime.now();
    }
    
    public PlatformSetting(String key, String value, ValueType valueType, String description) {
        this(key, value, valueType);
        this.description = description;
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
    
    // Helper methods
    public String getStringValue() {
        return value;
    }
    
    public Integer getIntegerValue() {
        if (value == null) return null;
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }
    
    public Boolean getBooleanValue() {
        if (value == null) return null;
        return Boolean.parseBoolean(value);
    }
    
    public Double getDecimalValue() {
        if (value == null) return null;
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public ValueType getValueType() { return valueType; }
    public void setValueType(ValueType valueType) { this.valueType = valueType; }
    
    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
    
    public Boolean getIsSystem() { return isSystem; }
    public void setIsSystem(Boolean isSystem) { this.isSystem = isSystem; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
