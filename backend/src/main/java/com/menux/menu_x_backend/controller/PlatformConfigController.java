package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.dto.admin.PlatformSettingDTO;
import com.menux.menu_x_backend.entity.PlatformSetting;
import com.menux.menu_x_backend.service.PlatformSettingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/platform-config")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class PlatformConfigController {
    
    @Autowired
    private PlatformSettingService settingService;
    
    @GetMapping
    public ResponseEntity<List<PlatformSettingDTO>> getAllSettings() {
        List<PlatformSettingDTO> settings = settingService.getAllSettings();
        return ResponseEntity.ok(settings);
    }
    
    @GetMapping("/user-configurable")
    public ResponseEntity<List<PlatformSettingDTO>> getUserConfigurableSettings() {
        List<PlatformSettingDTO> settings = settingService.getUserConfigurableSettings();
        return ResponseEntity.ok(settings);
    }
    
    @GetMapping("/{key}")
    public ResponseEntity<PlatformSettingDTO> getSettingByKey(@PathVariable String key) {
        return settingService.getSettingByKey(key)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<PlatformSettingDTO> createSetting(@RequestBody CreateSettingRequest request) {
        try {
            PlatformSettingDTO setting = settingService.createSetting(
                    request.getKey(),
                    request.getValue(),
                    request.getValueType(),
                    request.getDescription(),
                    request.getIsPublic()
            );
            return ResponseEntity.ok(setting);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{key}")
    public ResponseEntity<PlatformSettingDTO> updateSetting(
            @PathVariable String key,
            @RequestBody UpdateSettingRequest request) {
        try {
            PlatformSettingDTO setting = settingService.updateSetting(
                    key,
                    request.getValue(),
                    request.getDescription(),
                    request.getIsPublic()
            );
            return ResponseEntity.ok(setting);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/{key}")
    public ResponseEntity<Void> deleteSetting(@PathVariable String key) {
        try {
            settingService.deleteSetting(key);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/initialize")
    public ResponseEntity<Map<String, String>> initializeDefaultSettings() {
        settingService.initializeDefaultSettings();
        return ResponseEntity.ok(Map.of("message", "Default settings initialized successfully"));
    }
    
    // Request DTOs
    static class CreateSettingRequest {
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
    
    static class UpdateSettingRequest {
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
}

// Public endpoint for accessing public settings
@RestController
@RequestMapping("/api/public/settings")
class PublicSettingController {
    
    @Autowired
    private PlatformSettingService settingService;
    
    @GetMapping
    public ResponseEntity<List<PlatformSettingDTO>> getPublicSettings() {
        List<PlatformSettingDTO> settings = settingService.getPublicSettings();
        return ResponseEntity.ok(settings);
    }
    
    @GetMapping("/{key}")
    public ResponseEntity<Map<String, String>> getPublicSetting(@PathVariable String key) {
        return settingService.getSettingByKey(key)
                .filter(setting -> setting.getIsPublic())
                .map(setting -> ResponseEntity.ok(Map.of("key", setting.getKey(), "value", setting.getValue())))
                .orElse(ResponseEntity.notFound().build());
    }
}
