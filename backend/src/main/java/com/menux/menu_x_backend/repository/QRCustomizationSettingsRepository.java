package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.QRCustomizationSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface QRCustomizationSettingsRepository extends JpaRepository<QRCustomizationSettings, Long> {
    
    /**
     * Find QR customization settings by restaurant ID
     */
    Optional<QRCustomizationSettings> findByRestaurantId(Long restaurantId);
    
    /**
     * Check if settings exist for a restaurant
     */
    boolean existsByRestaurantId(Long restaurantId);
    
    /**
     * Delete settings by restaurant ID
     */
    void deleteByRestaurantId(Long restaurantId);
}
