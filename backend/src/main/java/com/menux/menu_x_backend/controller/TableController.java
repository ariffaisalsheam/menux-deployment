package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.entity.Table;
import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.QRCustomizationSettings;
import com.menux.menu_x_backend.service.RestaurantService;
import com.menux.menu_x_backend.service.TableService;
import com.menux.menu_x_backend.service.QRCodeService;
import com.menux.menu_x_backend.service.QRCustomizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/tables")
@PreAuthorize("hasRole('RESTAURANT_OWNER')")
public class TableController {

    @Autowired
    private TableService tableService;

    @Autowired
    private QRCodeService qrCodeService;

    @Autowired
    private RestaurantService restaurantService;

    @Autowired
    private QRCustomizationService qrCustomizationService;

    /**
     * Get all tables for current restaurant
     */
    @GetMapping
    public ResponseEntity<List<Table>> getAllTables() {
        Restaurant restaurant = getCurrentRestaurant();
        if (restaurant == null) {
            return ResponseEntity.notFound().build();
        }

        List<Table> tables = tableService.getTablesByRestaurant(restaurant.getId());
        return ResponseEntity.ok(tables);
    }

    /**
     * Get table by ID
     */
    @GetMapping("/{tableId}")
    public ResponseEntity<Table> getTable(@PathVariable Long tableId) {
        Restaurant restaurant = getCurrentRestaurant();
        if (restaurant == null) {
            return ResponseEntity.notFound().build();
        }

        Optional<Table> table = tableService.getTableById(tableId, restaurant.getId());
        return table.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create new table
     */
    @PostMapping
    public ResponseEntity<Table> createTable(@RequestBody CreateTableRequest request) {
        Restaurant restaurant = getCurrentRestaurant();
        if (restaurant == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            Table table = tableService.createTable(
                restaurant.getId(),
                request.getTableNumber(),
                request.getTableName(),
                request.getCapacity(),
                request.getLocationDescription()
            );
            return ResponseEntity.ok(table);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Update table
     */
    @PutMapping("/{tableId}")
    public ResponseEntity<Table> updateTable(@PathVariable Long tableId, 
                                            @RequestBody UpdateTableRequest request) {
        Restaurant restaurant = getCurrentRestaurant();
        if (restaurant == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            Table table = tableService.updateTable(
                tableId,
                restaurant.getId(),
                request.getTableNumber(),
                request.getTableName(),
                request.getCapacity(),
                request.getLocationDescription()
            );
            return ResponseEntity.ok(table);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Update table status
     */
    @PatchMapping("/{tableId}/status")
    public ResponseEntity<Table> updateTableStatus(@PathVariable Long tableId, 
                                                  @RequestBody TableStatusRequest request) {
        Restaurant restaurant = getCurrentRestaurant();
        if (restaurant == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            Table table = tableService.updateTableStatus(tableId, restaurant.getId(), request.getStatus());
            return ResponseEntity.ok(table);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Delete table
     */
    @DeleteMapping("/{tableId}")
    public ResponseEntity<Void> deleteTable(@PathVariable Long tableId) {
        Restaurant restaurant = getCurrentRestaurant();
        if (restaurant == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            tableService.deleteTable(tableId, restaurant.getId());
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Bulk create tables
     */
    @PostMapping("/bulk")
    public ResponseEntity<List<Table>> createBulkTables(@RequestBody BulkCreateTablesRequest request) {
        Restaurant restaurant = getCurrentRestaurant();
        if (restaurant == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            List<Table> tables = tableService.createBulkTables(
                restaurant.getId(),
                request.getTableNumbers(),
                request.getDefaultCapacity(),
                request.getDefaultLocation()
            );
            return ResponseEntity.ok(tables);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get table statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getTableStatistics() {
        Restaurant restaurant = getCurrentRestaurant();
        if (restaurant == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> stats = tableService.getTableStatistics(restaurant.getId());
        return ResponseEntity.ok(stats);
    }

    /**
     * Generate QR code for specific table
     */
    @GetMapping("/{tableId}/qr-code")
    public ResponseEntity<byte[]> generateTableQRCode(@PathVariable Long tableId,
                                                     @RequestParam(required = false) Integer size,
                                                     @RequestParam(required = false) Boolean branded) {
        Restaurant restaurant = getCurrentRestaurant();
        if (restaurant == null) {
            return ResponseEntity.notFound().build();
        }

        Optional<Table> tableOpt = tableService.getTableById(tableId, restaurant.getId());
        if (tableOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Table table = tableOpt.get();

        try {
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
                    table.getTableNumber(),
                    validatedSize,
                    customSettings
                );
            } else {
                qrCodeBytes = qrCodeService.generateTableQRCode(
                    restaurant.getId(),
                    table.getTableNumber(),
                    validatedSize
                );
            }

            // Update table QR code info
            tableService.updateTableQRCode(tableId, restaurant.getId(), "generated");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setContentDispositionFormData("attachment",
                "table-" + table.getTableNumber() + "-qr.png");

            return new ResponseEntity<>(qrCodeBytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Generate QR code sheet for multiple tables
     */
    @PostMapping("/qr-code-sheet")
    public ResponseEntity<byte[]> generateQRCodeSheet(@RequestBody QRCodeSheetRequest request) {
        Restaurant restaurant = getCurrentRestaurant();
        if (restaurant == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            byte[] sheetBytes = qrCodeService.generateTableQRCodeSheet(
                restaurant.getId(),
                restaurant.getName(),
                request.getTableNumbers(),
                request.getQrSize(),
                request.getTablesPerRow()
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setContentDispositionFormData("attachment",
                restaurant.getName().replaceAll("[^a-zA-Z0-9]", "-") + "-table-qr-sheet.png");

            return new ResponseEntity<>(sheetBytes, headers, HttpStatus.OK);

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

    // Request DTOs
    public static class CreateTableRequest {
        private String tableNumber;
        private String tableName;
        private Integer capacity;
        private String locationDescription;

        // Getters and setters
        public String getTableNumber() { return tableNumber; }
        public void setTableNumber(String tableNumber) { this.tableNumber = tableNumber; }

        public String getTableName() { return tableName; }
        public void setTableName(String tableName) { this.tableName = tableName; }

        public Integer getCapacity() { return capacity; }
        public void setCapacity(Integer capacity) { this.capacity = capacity; }

        public String getLocationDescription() { return locationDescription; }
        public void setLocationDescription(String locationDescription) { this.locationDescription = locationDescription; }
    }

    public static class UpdateTableRequest extends CreateTableRequest {
        // Inherits all fields from CreateTableRequest
    }

    public static class TableStatusRequest {
        private Table.TableStatus status;

        public Table.TableStatus getStatus() { return status; }
        public void setStatus(Table.TableStatus status) { this.status = status; }
    }

    public static class BulkCreateTablesRequest {
        private List<String> tableNumbers;
        private Integer defaultCapacity;
        private String defaultLocation;

        public List<String> getTableNumbers() { return tableNumbers; }
        public void setTableNumbers(List<String> tableNumbers) { this.tableNumbers = tableNumbers; }

        public Integer getDefaultCapacity() { return defaultCapacity; }
        public void setDefaultCapacity(Integer defaultCapacity) { this.defaultCapacity = defaultCapacity; }

        public String getDefaultLocation() { return defaultLocation; }
        public void setDefaultLocation(String defaultLocation) { this.defaultLocation = defaultLocation; }
    }

    public static class QRCodeSheetRequest {
        private List<String> tableNumbers;
        private Integer qrSize = 200;
        private Integer tablesPerRow = 3;

        public List<String> getTableNumbers() { return tableNumbers; }
        public void setTableNumbers(List<String> tableNumbers) { this.tableNumbers = tableNumbers; }

        public Integer getQrSize() { return qrSize; }
        public void setQrSize(Integer qrSize) { this.qrSize = qrSize; }

        public Integer getTablesPerRow() { return tablesPerRow; }
        public void setTablesPerRow(Integer tablesPerRow) { this.tablesPerRow = tablesPerRow; }
    }
}
