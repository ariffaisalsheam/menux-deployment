package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.dto.admin.PlatformSettingDTO;
import com.menux.menu_x_backend.entity.PlatformSetting;
import com.menux.menu_x_backend.repository.PlatformSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PlatformSettingService {
    
    @Autowired
    private PlatformSettingRepository repository;
    
    // Public methods for getting settings
    public Optional<String> getSettingValue(String key) {
        return repository.findByKey(key).map(PlatformSetting::getValue);
    }
    
    public String getSettingValue(String key, String defaultValue) {
        return getSettingValue(key).orElse(defaultValue);
    }
    
    public Optional<Integer> getIntegerSetting(String key) {
        return repository.findByKey(key).map(PlatformSetting::getIntegerValue);
    }
    
    public Integer getIntegerSetting(String key, Integer defaultValue) {
        return getIntegerSetting(key).orElse(defaultValue);
    }
    
    public Optional<Boolean> getBooleanSetting(String key) {
        return repository.findByKey(key).map(PlatformSetting::getBooleanValue);
    }
    
    public Boolean getBooleanSetting(String key, Boolean defaultValue) {
        return getBooleanSetting(key).orElse(defaultValue);
    }
    
    public Optional<Double> getDecimalSetting(String key) {
        return repository.findByKey(key).map(PlatformSetting::getDecimalValue);
    }
    
    public Double getDecimalSetting(String key, Double defaultValue) {
        return getDecimalSetting(key).orElse(defaultValue);
    }
    
    // Admin methods for managing settings
    public List<PlatformSettingDTO> getAllSettings() {
        return repository.findAll().stream()
                .map(PlatformSettingDTO::new)
                .collect(Collectors.toList());
    }
    
    public List<PlatformSettingDTO> getPublicSettings() {
        return repository.findByIsPublicTrue().stream()
                .map(PlatformSettingDTO::new)
                .collect(Collectors.toList());
    }
    
    public List<PlatformSettingDTO> getUserConfigurableSettings() {
        return repository.findUserConfigurableSettings().stream()
                .map(PlatformSettingDTO::new)
                .collect(Collectors.toList());
    }
    
    public Optional<PlatformSettingDTO> getSettingByKey(String key) {
        return repository.findByKey(key).map(PlatformSettingDTO::new);
    }
    
    @Transactional
    public PlatformSettingDTO createSetting(String key, String value, PlatformSetting.ValueType valueType, String description, Boolean isPublic) {
        if (repository.existsByKey(key)) {
            throw new RuntimeException("Setting with key '" + key + "' already exists");
        }
        
        PlatformSetting setting = new PlatformSetting(key, value, valueType, description);
        setting.setIsPublic(isPublic != null ? isPublic : false);
        setting.setIsSystem(false); // User-created settings are never system settings
        
        setting = repository.save(setting);
        return new PlatformSettingDTO(setting);
    }
    
    @Transactional
    public PlatformSettingDTO updateSetting(String key, String value, String description, Boolean isPublic) {
        PlatformSetting setting = repository.findByKey(key)
                .orElseThrow(() -> new RuntimeException("Setting not found with key: " + key));
        
        if (value != null) setting.setValue(value);
        if (description != null) setting.setDescription(description);
        if (isPublic != null) setting.setIsPublic(isPublic);
        
        setting = repository.save(setting);
        return new PlatformSettingDTO(setting);
    }
    
    @Transactional
    public void deleteSetting(String key) {
        PlatformSetting setting = repository.findByKey(key)
                .orElseThrow(() -> new RuntimeException("Setting not found with key: " + key));
        
        if (setting.getIsSystem()) {
            throw new RuntimeException("Cannot delete system setting: " + key);
        }
        
        repository.delete(setting);
    }
    
    // Initialize default system settings
    @Transactional
    public void initializeDefaultSettings() {
        createSystemSettingIfNotExists("app.name", "Menu.X", PlatformSetting.ValueType.STRING, "Application name", true);
        createSystemSettingIfNotExists("app.version", "1.0.0", PlatformSetting.ValueType.STRING, "Application version", true);
        createSystemSettingIfNotExists("app.maintenance_mode", "false", PlatformSetting.ValueType.BOOLEAN, "Whether the application is in maintenance mode", false);
        createSystemSettingIfNotExists("pricing.pro_plan_monthly", "1500", PlatformSetting.ValueType.INTEGER, "Pro plan monthly price in BDT", true);
        createSystemSettingIfNotExists("features.registration_enabled", "true", PlatformSetting.ValueType.BOOLEAN, "Whether new user registration is enabled", false);
        createSystemSettingIfNotExists("features.ai_enabled", "true", PlatformSetting.ValueType.BOOLEAN, "Whether AI features are enabled globally", false);
    }
    
    private void createSystemSettingIfNotExists(String key, String value, PlatformSetting.ValueType valueType, String description, Boolean isPublic) {
        if (!repository.existsByKey(key)) {
            PlatformSetting setting = new PlatformSetting(key, value, valueType, description);
            setting.setIsPublic(isPublic);
            setting.setIsSystem(true);
            repository.save(setting);
        }
    }
}
