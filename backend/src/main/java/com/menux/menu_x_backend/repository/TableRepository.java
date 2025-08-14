package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.Table;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TableRepository extends JpaRepository<Table, Long> {

    /**
     * Find all tables for a specific restaurant
     */
    List<Table> findByRestaurantIdAndIsActiveTrueOrderByTableNumber(Long restaurantId);

    /**
     * Find all tables for a restaurant (including inactive)
     */
    List<Table> findByRestaurantIdOrderByTableNumber(Long restaurantId);

    /**
     * Find table by restaurant and table number
     */
    Optional<Table> findByRestaurantIdAndTableNumberAndIsActiveTrue(Long restaurantId, String tableNumber);

    /**
     * Find table by id scoped to a restaurant
     */
    Optional<Table> findByIdAndRestaurantIdAndIsActiveTrue(Long tableId, Long restaurantId);

    /**
     * Find tables by status for a restaurant
     */
    List<Table> findByRestaurantIdAndStatusAndIsActiveTrueOrderByTableNumber(Long restaurantId, Table.TableStatus status);

    /**
     * Find available tables for a restaurant
     */
    @Query("SELECT t FROM Table t WHERE t.restaurant.id = :restaurantId AND t.status = 'AVAILABLE' AND t.isActive = true ORDER BY t.tableNumber")
    List<Table> findAvailableTablesByRestaurant(@Param("restaurantId") Long restaurantId);

    /**
     * Find occupied tables for a restaurant
     */
    @Query("SELECT t FROM Table t WHERE t.restaurant.id = :restaurantId AND t.status = 'OCCUPIED' AND t.isActive = true ORDER BY t.tableNumber")
    List<Table> findOccupiedTablesByRestaurant(@Param("restaurantId") Long restaurantId);

    /**
     * Count tables by status for a restaurant
     */
    Long countByRestaurantIdAndStatusAndIsActiveTrue(Long restaurantId, Table.TableStatus status);

    /**
     * Count total active tables for a restaurant
     */
    Long countByRestaurantIdAndIsActiveTrue(Long restaurantId);

    /**
     * Check if table number exists for a restaurant
     */
    boolean existsByRestaurantIdAndTableNumberAndIsActiveTrue(Long restaurantId, String tableNumber);

    /**
     * Find tables with capacity greater than or equal to specified number
     */
    @Query("SELECT t FROM Table t WHERE t.restaurant.id = :restaurantId AND t.capacity >= :minCapacity AND t.isActive = true ORDER BY t.capacity, t.tableNumber")
    List<Table> findTablesByMinCapacity(@Param("restaurantId") Long restaurantId, @Param("minCapacity") Integer minCapacity);

    /**
     * Get table statistics for a restaurant
     */
    @Query("SELECT t.status, COUNT(t) FROM Table t WHERE t.restaurant.id = :restaurantId AND t.isActive = true GROUP BY t.status")
    List<Object[]> getTableStatsByRestaurant(@Param("restaurantId") Long restaurantId);

    /**
     * Find tables that need QR code generation (no QR code URL or old generation date)
     */
    @Query("SELECT t FROM Table t WHERE t.restaurant.id = :restaurantId AND t.isActive = true AND (t.qrCodeUrl IS NULL OR t.qrCodeGeneratedAt IS NULL)")
    List<Table> findTablesNeedingQRGeneration(@Param("restaurantId") Long restaurantId);

    /**
     * Find tables by location description
     */
    List<Table> findByRestaurantIdAndLocationDescriptionContainingIgnoreCaseAndIsActiveTrue(Long restaurantId, String locationKeyword);

    /**
     * Update table status
     */
    @Modifying
    @Query("UPDATE Table t SET t.status = :status, t.updatedAt = CURRENT_TIMESTAMP WHERE t.id = :tableId")
    void updateTableStatus(@Param("tableId") Long tableId, @Param("status") Table.TableStatus status);

    /**
     * Bulk update table status for multiple tables
     */
    @Modifying
    @Query("UPDATE Table t SET t.status = :status, t.updatedAt = CURRENT_TIMESTAMP WHERE t.id IN :tableIds")
    void updateMultipleTableStatus(@Param("tableIds") List<Long> tableIds, @Param("status") Table.TableStatus status);
}
