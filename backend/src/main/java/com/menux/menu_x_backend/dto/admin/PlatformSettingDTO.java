package com.menux.menu_x_backend.dto.admin;

import com.menux.menu_x_backend.entity.PlatformSetting;

import java.time.LocalDateTime;

public class PlatformSettingDTO {
    private Long id;
    private String key;
    private String value;
    private String description;
    private PlatformSetting.ValueType valueType;
    private Boolean isPublic;
    private Boolean isSystem;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructors
    public PlatformSettingDTO() {}
    
    public PlatformSettingDTO(PlatformSetting setting) {
        this.id = setting.getId();
        this.key = setting.getKey();
        this.value = setting.getValue();
        this.description = setting.getDescription();
        this.valueType = setting.getValueType();
        this.isPublic = setting.getIsPublic();
        this.isSystem = setting.getIsSystem();
        this.createdAt = setting.getCreatedAt();
        this.updatedAt = setting.getUpdatedAt();
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
    
    public PlatformSetting.ValueType getValueType() { return valueType; }
    public void setValueType(PlatformSetting.ValueType valueType) { this.valueType = valueType; }
    
    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
    
    public Boolean getIsSystem() { return isSystem; }
    public void setIsSystem(Boolean isSystem) { this.isSystem = isSystem; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

// Request DTOs
class CreatePlatformSettingRequest {
    private String key;
    private String value;
    private String description;
    private PlatformSetting.ValueType valueType;
    private Boolean isPublic;
    
    // Getters and Setters
    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public PlatformSetting.ValueType getValueType() { return valueType; }
    public void setValueType(PlatformSetting.ValueType valueType) { this.valueType = valueType; }
    
    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
}

class UpdatePlatformSettingRequest {
    private String value;
    private String description;
    private Boolean isPublic;
    
    // Getters and Setters
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
}
