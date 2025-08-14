package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.entity.Table;
import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.repository.TableRepository;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@Service
@Transactional
public class TableService {

    @Autowired
    private TableRepository tableRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    /**
     * Get all tables for a restaurant
     */
    public List<Table> getTablesByRestaurant(Long restaurantId) {
        return tableRepository.findByRestaurantIdAndIsActiveTrueOrderByTableNumber(restaurantId);
    }

    /**
     * Get table by ID and restaurant
     */
    public Optional<Table> getTableById(Long tableId, Long restaurantId) {
        return tableRepository.findByIdAndRestaurantIdAndIsActiveTrue(tableId, restaurantId);
    }

    /**
     * Get table by table number and restaurant
     */
    public Optional<Table> getTableByNumber(String tableNumber, Long restaurantId) {
        return tableRepository.findByRestaurantIdAndTableNumberAndIsActiveTrue(restaurantId, tableNumber);
    }

    /**
     * Create a new table
     */
    public Table createTable(Long restaurantId, String tableNumber, String tableName, 
                           Integer capacity, String locationDescription) {
        
        // Check if restaurant exists
        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(restaurantId);
        if (restaurantOpt.isEmpty()) {
            throw new RuntimeException("Restaurant not found");
        }

        // Check if table number already exists
        if (tableRepository.existsByRestaurantIdAndTableNumberAndIsActiveTrue(restaurantId, tableNumber)) {
            throw new RuntimeException("Table number already exists");
        }

        Table table = new Table();
        table.setRestaurant(restaurantOpt.get());
        table.setTableNumber(tableNumber);
        table.setTableName(tableName);
        table.setCapacity(capacity);
        table.setLocationDescription(locationDescription);
        table.setStatus(Table.TableStatus.AVAILABLE);
        table.setIsActive(true);
        table.setCreatedAt(LocalDateTime.now());

        return tableRepository.save(table);
    }

    /**
     * Update table information
     */
    public Table updateTable(Long tableId, Long restaurantId, String tableNumber, 
                           String tableName, Integer capacity, String locationDescription) {
        
        Optional<Table> tableOpt = getTableById(tableId, restaurantId);
        if (tableOpt.isEmpty()) {
            throw new RuntimeException("Table not found");
        }

        Table table = tableOpt.get();

        // Check if new table number conflicts with existing tables
        if (!table.getTableNumber().equals(tableNumber) && 
            tableRepository.existsByRestaurantIdAndTableNumberAndIsActiveTrue(restaurantId, tableNumber)) {
            throw new RuntimeException("Table number already exists");
        }

        table.setTableNumber(tableNumber);
        table.setTableName(tableName);
        table.setCapacity(capacity);
        table.setLocationDescription(locationDescription);
        table.setUpdatedAt(LocalDateTime.now());

        return tableRepository.save(table);
    }

    /**
     * Update table status
     */
    public Table updateTableStatus(Long tableId, Long restaurantId, Table.TableStatus status) {
        Optional<Table> tableOpt = getTableById(tableId, restaurantId);
        if (tableOpt.isEmpty()) {
            throw new RuntimeException("Table not found");
        }

        Table table = tableOpt.get();
        table.setStatus(status);
        table.setUpdatedAt(LocalDateTime.now());

        return tableRepository.save(table);
    }

    /**
     * Delete table (soft delete)
     */
    public void deleteTable(Long tableId, Long restaurantId) {
        Optional<Table> tableOpt = getTableById(tableId, restaurantId);
        if (tableOpt.isEmpty()) {
            throw new RuntimeException("Table not found");
        }

        Table table = tableOpt.get();
        table.setIsActive(false);
        table.setUpdatedAt(LocalDateTime.now());
        tableRepository.save(table);
    }

    /**
     * Bulk create tables
     */
    public List<Table> createBulkTables(Long restaurantId, List<String> tableNumbers, 
                                      Integer defaultCapacity, String defaultLocation) {
        
        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(restaurantId);
        if (restaurantOpt.isEmpty()) {
            throw new RuntimeException("Restaurant not found");
        }

        Restaurant restaurant = restaurantOpt.get();
        List<Table> tables = new java.util.ArrayList<>();

        for (String tableNumber : tableNumbers) {
            // Skip if table already exists
            if (tableRepository.existsByRestaurantIdAndTableNumberAndIsActiveTrue(restaurantId, tableNumber)) {
                continue;
            }

            Table table = new Table();
            table.setRestaurant(restaurant);
            table.setTableNumber(tableNumber);
            table.setCapacity(defaultCapacity);
            table.setLocationDescription(defaultLocation);
            table.setStatus(Table.TableStatus.AVAILABLE);
            table.setIsActive(true);
            table.setCreatedAt(LocalDateTime.now());

            tables.add(table);
        }

        return tableRepository.saveAll(tables);
    }

    /**
     * Get table statistics for a restaurant
     */
    public Map<String, Object> getTableStatistics(Long restaurantId) {
        Map<String, Object> stats = new HashMap<>();
        
        Long totalTables = tableRepository.countByRestaurantIdAndIsActiveTrue(restaurantId);
        Long availableTables = tableRepository.countByRestaurantIdAndStatusAndIsActiveTrue(restaurantId, Table.TableStatus.AVAILABLE);
        Long occupiedTables = tableRepository.countByRestaurantIdAndStatusAndIsActiveTrue(restaurantId, Table.TableStatus.OCCUPIED);
        Long reservedTables = tableRepository.countByRestaurantIdAndStatusAndIsActiveTrue(restaurantId, Table.TableStatus.RESERVED);
        Long cleaningTables = tableRepository.countByRestaurantIdAndStatusAndIsActiveTrue(restaurantId, Table.TableStatus.CLEANING);

        stats.put("totalTables", totalTables);
        stats.put("availableTables", availableTables);
        stats.put("occupiedTables", occupiedTables);
        stats.put("reservedTables", reservedTables);
        stats.put("cleaningTables", cleaningTables);
        stats.put("occupancyRate", totalTables > 0 ? (double) occupiedTables / totalTables * 100 : 0.0);

        return stats;
    }

    /**
     * Get tables by status
     */
    public List<Table> getTablesByStatus(Long restaurantId, Table.TableStatus status) {
        return tableRepository.findByRestaurantIdAndStatusAndIsActiveTrueOrderByTableNumber(restaurantId, status);
    }

    /**
     * Get available tables with minimum capacity
     */
    public List<Table> getAvailableTablesByCapacity(Long restaurantId, Integer minCapacity) {
        return tableRepository.findTablesByMinCapacity(restaurantId, minCapacity);
    }

    /**
     * Update QR code information for table
     */
    public Table updateTableQRCode(Long tableId, Long restaurantId, String qrCodeUrl) {
        Optional<Table> tableOpt = getTableById(tableId, restaurantId);
        if (tableOpt.isEmpty()) {
            throw new RuntimeException("Table not found");
        }

        Table table = tableOpt.get();
        table.setQrCodeUrl(qrCodeUrl);
        table.setQrCodeGeneratedAt(LocalDateTime.now());
        table.setUpdatedAt(LocalDateTime.now());

        return tableRepository.save(table);
    }

    /**
     * Get tables that need QR code generation
     */
    public List<Table> getTablesNeedingQRGeneration(Long restaurantId) {
        return tableRepository.findTablesNeedingQRGeneration(restaurantId);
    }
}
