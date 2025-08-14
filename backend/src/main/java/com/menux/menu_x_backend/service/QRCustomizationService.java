package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.entity.QRCustomizationSettings;
import com.menux.menu_x_backend.repository.QRCustomizationSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class QRCustomizationService {
    
    @Autowired
    private QRCustomizationSettingsRepository qrCustomizationSettingsRepository;
    
    /**
     * Get QR customization settings for a restaurant
     * Returns default settings if none exist
     */
    public QRCustomizationSettings getSettingsForRestaurant(Long restaurantId) {
        Optional<QRCustomizationSettings> settings = qrCustomizationSettingsRepository.findByRestaurantId(restaurantId);
        
        if (settings.isPresent()) {
            return settings.get();
        } else {
            // Return default settings
            return createDefaultSettings(restaurantId);
        }
    }
    
    /**
     * Save or update QR customization settings for a restaurant
     */
    public QRCustomizationSettings saveSettings(Long restaurantId, QRCustomizationSettings settings) {
        Optional<QRCustomizationSettings> existingSettings = qrCustomizationSettingsRepository.findByRestaurantId(restaurantId);
        
        if (existingSettings.isPresent()) {
            // Update existing settings
            QRCustomizationSettings existing = existingSettings.get();
            existing.setSize(settings.getSize());
            existing.setBranded(settings.getBranded());
            existing.setRestaurantNameDisplay(settings.getRestaurantNameDisplay());
            existing.setTableNameFormat(settings.getTableNameFormat());
            existing.setFontSize(settings.getFontSize());
            existing.setTextPosition(settings.getTextPosition());
            
            return qrCustomizationSettingsRepository.save(existing);
        } else {
            // Create new settings
            settings.setRestaurantId(restaurantId);
            return qrCustomizationSettingsRepository.save(settings);
        }
    }
    
    /**
     * Delete QR customization settings for a restaurant
     */
    public void deleteSettings(Long restaurantId) {
        qrCustomizationSettingsRepository.deleteByRestaurantId(restaurantId);
    }
    
    /**
     * Check if settings exist for a restaurant
     */
    public boolean hasSettings(Long restaurantId) {
        return qrCustomizationSettingsRepository.existsByRestaurantId(restaurantId);
    }
    
    /**
     * Create default settings for a restaurant
     */
    private QRCustomizationSettings createDefaultSettings(Long restaurantId) {
        QRCustomizationSettings defaultSettings = new QRCustomizationSettings(restaurantId);
        // Default values are already set in the entity constructor and field defaults
        return defaultSettings;
    }
    
    /**
     * Reset settings to default for a restaurant
     */
    public QRCustomizationSettings resetToDefault(Long restaurantId) {
        // Delete existing settings
        deleteSettings(restaurantId);
        
        // Create and save default settings
        QRCustomizationSettings defaultSettings = createDefaultSettings(restaurantId);
        return qrCustomizationSettingsRepository.save(defaultSettings);
    }
}
