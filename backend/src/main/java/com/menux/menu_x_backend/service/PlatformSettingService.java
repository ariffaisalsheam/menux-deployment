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

        // Public settings for manual bKash payments (avoid 404s on /api/public/settings/*)
        createSystemSettingIfNotExists("PAYMENT_BKASH_MERCHANT_NUMBER", "", PlatformSetting.ValueType.STRING, "Public bKash merchant number for manual payments", true);
        createSystemSettingIfNotExists("PAYMENT_BKASH_MIN_AMOUNT", "0", PlatformSetting.ValueType.INTEGER, "Minimum manual bKash payment amount in BDT", true);
        createSystemSettingIfNotExists("PAYMENT_BKASH_INSTRUCTIONS", "", PlatformSetting.ValueType.STRING, "Public instructions for manual bKash payment", true);

        // Subscription & Trials (system settings)
        createSystemSettingIfNotExists("SUB_TRIAL_ENABLED", "true", PlatformSetting.ValueType.BOOLEAN, "Whether free trial is enabled for new restaurants", false);
        createSystemSettingIfNotExists("SUB_TRIAL_DAYS_DEFAULT", "14", PlatformSetting.ValueType.INTEGER, "Default number of trial days", false);
        createSystemSettingIfNotExists("SUB_GRACE_DAYS_DEFAULT", "3", PlatformSetting.ValueType.INTEGER, "Default grace period after trial/period ends", false);
        createSystemSettingIfNotExists("SUB_PRO_PERIOD_DAYS", "30", PlatformSetting.ValueType.INTEGER, "Number of days granted per approved PRO period (e.g., monthly)", false);
        createSystemSettingIfNotExists("SUB_NOTIFY_DAYS_BEFORE_TRIAL_END", "3", PlatformSetting.ValueType.INTEGER, "Days before trial end to notify owner", false);
        createSystemSettingIfNotExists("SUB_NOTIFY_DAYS_BEFORE_PERIOD_END", "5", PlatformSetting.ValueType.INTEGER, "Days before paid period end to notify owner", false);
        createSystemSettingIfNotExists("SUB_TRIAL_ONCE_PER_RESTAURANT", "true", PlatformSetting.ValueType.BOOLEAN, "Allow only one trial per restaurant", false);
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
