package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.QRCustomizationSettings;
import com.menux.menu_x_backend.service.RestaurantService;
import com.menux.menu_x_backend.service.QRCodeService;
import com.menux.menu_x_backend.service.QRCustomizationService;
import com.menux.menu_x_backend.dto.qr.QRCustomizationSettingsDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/qr")
@PreAuthorize("hasRole('RESTAURANT_OWNER')")
public class QRCodeController {

    @Autowired
    private QRCodeService qrCodeService;

    @Autowired
    private RestaurantService restaurantService;

    @Autowired
    private QRCustomizationService qrCustomizationService;

    /**
     * Generate QR code for current restaurant using saved customization settings
     */
    @GetMapping("/generate")
    public ResponseEntity<byte[]> generateQRCode(
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) Boolean branded) {

        try {
            Restaurant restaurant = getCurrentRestaurant();
            if (restaurant == null) {
                return ResponseEntity.notFound().build();
            }

            // Get saved customization settings
            QRCustomizationSettings customSettings = qrCustomizationService.getSettingsForRestaurant(restaurant.getId());

            // Override with provided parameters if specified
            if (size != null) {
                customSettings.setSize(size);
            }
            if (branded != null) {
                customSettings.setBranded(branded);
            }

            int validatedSize = qrCodeService.validateSize(customSettings.getSize());
            byte[] qrCodeBytes;

            if (customSettings.getBranded()) {
                qrCodeBytes = qrCodeService.generateCustomizedBrandedTableQRCode(
                    restaurant.getId(),
                    restaurant.getName(),
                    "1", // Default table number for generic QR
                    validatedSize,
                    customSettings
                );
            } else {
                qrCodeBytes = qrCodeService.generateTableQRCode(restaurant.getId(), "1", validatedSize);
            }

            // Update restaurant QR code metadata
            restaurant.setQrCodeSize(validatedSize);
            restaurant.setQrCodeGeneratedAt(LocalDateTime.now());
            restaurantService.updateRestaurant(restaurant);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setContentDispositionFormData("attachment",
                "menu-qr-" + restaurant.getName().replaceAll("[^a-zA-Z0-9]", "-") + ".png");

            return new ResponseEntity<>(qrCodeBytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get QR code information for current restaurant
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getQRCodeInfo() {
        Restaurant restaurant = getCurrentRestaurant();
        if (restaurant == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> info = new HashMap<>();
        info.put("restaurantId", restaurant.getId());
        info.put("restaurantName", restaurant.getName());
        // Note: Generic menu URLs are deprecated. Use table-specific URLs instead.
        info.put("menuUrl", "Table-specific QR codes should be generated through Table Management");
        info.put("qrCodeSize", restaurant.getQrCodeSize());
        info.put("qrCodeGeneratedAt", restaurant.getQrCodeGeneratedAt());
        info.put("subscriptionPlan", restaurant.getSubscriptionPlan().toString());

        return ResponseEntity.ok(info);
    }

    /**
     * Generate QR code in different formats
     */
    @GetMapping("/download/{format}")
    public ResponseEntity<byte[]> downloadQRCode(
            @PathVariable String format,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) Boolean branded) {

        try {
            Restaurant restaurant = getCurrentRestaurant();
            if (restaurant == null) {
                return ResponseEntity.notFound().build();
            }

            // Validate format
            if (!format.equalsIgnoreCase("png") && !format.equalsIgnoreCase("jpg")) {
                return ResponseEntity.badRequest().build();
            }

            // Get saved customization settings
            QRCustomizationSettings customSettings = qrCustomizationService.getSettingsForRestaurant(restaurant.getId());

            // Override with provided parameters if specified
            if (size != null) {
                customSettings.setSize(size);
            }
            if (branded != null) {
                customSettings.setBranded(branded);
            }

            int validatedSize = qrCodeService.validateSize(customSettings.getSize());
            byte[] qrCodeBytes;

            if (customSettings.getBranded()) {
                qrCodeBytes = qrCodeService.generateCustomizedBrandedTableQRCode(
                    restaurant.getId(),
                    restaurant.getName(),
                    "1", // Default table number for generic QR
                    validatedSize,
                    customSettings
                );
            } else {
                qrCodeBytes = qrCodeService.generateTableQRCode(restaurant.getId(), "1", validatedSize);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(format.equalsIgnoreCase("png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG);
            headers.setContentDispositionFormData("attachment",
                "menu-qr-" + restaurant.getName().replaceAll("[^a-zA-Z0-9]", "-") + "." + format.toLowerCase());

            return new ResponseEntity<>(qrCodeBytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Preview QR code (inline display) with customization settings
     */
    @GetMapping("/preview")
    public ResponseEntity<byte[]> previewQRCode(
            @RequestParam(defaultValue = "256") Integer size,
            @RequestParam(defaultValue = "false") Boolean branded,
            @RequestParam(required = false) String restaurantNameDisplay,
            @RequestParam(required = false) String tableNameFormat,
            @RequestParam(required = false) String fontSize,
            @RequestParam(required = false) String textPosition) {

        try {
            Restaurant restaurant = getCurrentRestaurant();
            if (restaurant == null) {
                return ResponseEntity.notFound().build();
            }

            // Get customization settings (either from parameters or saved settings)
            QRCustomizationSettings customSettings;
            if (restaurantNameDisplay != null || tableNameFormat != null || fontSize != null || textPosition != null) {
                // Use provided parameters
                customSettings = new QRCustomizationSettings(restaurant.getId());
                customSettings.setSize(size);
                customSettings.setBranded(branded);

                if (restaurantNameDisplay != null) {
                    customSettings.setRestaurantNameDisplay(parseRestaurantNameDisplay(restaurantNameDisplay));
                }
                if (tableNameFormat != null) {
                    customSettings.setTableNameFormat(parseTableNameFormat(tableNameFormat));
                }
                if (fontSize != null) {
                    customSettings.setFontSize(parseFontSize(fontSize));
                }
                if (textPosition != null) {
                    customSettings.setTextPosition(parseTextPosition(textPosition));
                }
            } else {
                // Use saved settings
                customSettings = qrCustomizationService.getSettingsForRestaurant(restaurant.getId());
                customSettings.setSize(size);
                customSettings.setBranded(branded);
            }

            int validatedSize = qrCodeService.validateSize(customSettings.getSize());
            byte[] qrCodeBytes;

            if (customSettings.getBranded()) {
                qrCodeBytes = qrCodeService.generateCustomizedBrandedTableQRCode(
                    restaurant.getId(),
                    restaurant.getName(),
                    "1", // Sample table number for preview
                    validatedSize,
                    customSettings
                );
            } else {
                qrCodeBytes = qrCodeService.generateTableQRCode(restaurant.getId(), "1", validatedSize);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setCacheControl("no-cache");

            return new ResponseEntity<>(qrCodeBytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Save QR customization settings
     */
    @PostMapping("/customization-settings")
    public ResponseEntity<QRCustomizationSettingsDTO> saveCustomizationSettings(
            @Valid @RequestBody QRCustomizationSettingsDTO settingsDTO) {

        try {
            Restaurant restaurant = getCurrentRestaurant();
            if (restaurant == null) {
                return ResponseEntity.notFound().build();
            }

            QRCustomizationSettings settings = settingsDTO.toEntity(restaurant.getId());
            QRCustomizationSettings savedSettings = qrCustomizationService.saveSettings(restaurant.getId(), settings);

            return ResponseEntity.ok(new QRCustomizationSettingsDTO(savedSettings));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get QR customization settings
     */
    @GetMapping("/customization-settings")
    public ResponseEntity<QRCustomizationSettingsDTO> getCustomizationSettings() {

        try {
            Restaurant restaurant = getCurrentRestaurant();
            if (restaurant == null) {
                return ResponseEntity.notFound().build();
            }

            QRCustomizationSettings settings = qrCustomizationService.getSettingsForRestaurant(restaurant.getId());
            return ResponseEntity.ok(new QRCustomizationSettingsDTO(settings));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get current restaurant for authenticated user
     */
    private Restaurant getCurrentRestaurant() {
        return restaurantService.getCurrentUserRestaurant().orElse(null);
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
}
