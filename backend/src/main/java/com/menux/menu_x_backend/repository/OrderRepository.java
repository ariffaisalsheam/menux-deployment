package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    List<Order> findByRestaurantId(Long restaurantId);
    
    List<Order> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);
    
    List<Order> findByRestaurantIdAndStatus(Long restaurantId, Order.OrderStatus status);
    
    List<Order> findByStatus(Order.OrderStatus status);
    
    @Query("SELECT o FROM Order o WHERE o.restaurant.id = :restaurantId AND o.createdAt BETWEEN :startDate AND :endDate")
    List<Order> findByRestaurantIdAndDateRange(@Param("restaurantId") Long restaurantId, 
                                               @Param("startDate") LocalDateTime startDate, 
                                               @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(o) FROM Order o WHERE o.restaurant.id = :restaurantId")
    long countByRestaurantId(@Param("restaurantId") Long restaurantId);
    
    @Query("SELECT COUNT(o) FROM Order o WHERE o.restaurant.id = :restaurantId AND o.status = :status")
    long countByRestaurantIdAndStatus(@Param("restaurantId") Long restaurantId, @Param("status") Order.OrderStatus status);
    
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.restaurant.id = :restaurantId AND o.status = 'SERVED'")
    BigDecimal sumTotalAmountByRestaurantIdAndServed(@Param("restaurantId") Long restaurantId);
    
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.restaurant.id = :restaurantId AND o.status = 'SERVED' AND o.createdAt BETWEEN :startDate AND :endDate")
    BigDecimal sumTotalAmountByRestaurantIdAndDateRange(@Param("restaurantId") Long restaurantId, 
                                                        @Param("startDate") LocalDateTime startDate, 
                                                        @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :date")
    long countOrdersSince(@Param("date") LocalDateTime date);
    
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = 'SERVED' AND o.createdAt >= :date")
    BigDecimal sumRevenueSince(@Param("date") LocalDateTime date);

    List<Order> findByRestaurantIdAndCreatedAtBetween(Long restaurantId, LocalDateTime startDate, LocalDateTime endDate);

    long countByRestaurantIdAndStatusIn(Long restaurantId, List<Order.OrderStatus> statuses);

    @Query(value = "SELECT restaurant_id FROM orders WHERE id = :orderId", nativeQuery = true)
    Long getRestaurantIdByOrderId(@Param("orderId") Long orderId);

    Optional<Order> findByRestaurantIdAndOrderNumber(Long restaurantId, String orderNumber);

    // New: fetch orders for public tracking by table number or by customer phone
    List<Order> findByRestaurantIdAndTableNumberOrderByCreatedAtDesc(Long restaurantId, String tableNumber);
    List<Order> findByRestaurantIdAndCustomerPhoneOrderByCreatedAtDesc(Long restaurantId, String customerPhone);

    // Distinct customers by phone within date range for SERVED orders
    @Query("SELECT COUNT(DISTINCT o.customerPhone) FROM Order o " +
           "WHERE o.restaurant.id = :restaurantId " +
           "AND o.status = 'SERVED' " +
           "AND o.customerPhone IS NOT NULL AND o.customerPhone <> '' " +
           "AND o.createdAt BETWEEN :startDate AND :endDate")
    long countDistinctCustomersByPhoneInRange(@Param("restaurantId") Long restaurantId,
                                              @Param("startDate") LocalDateTime startDate,
                                              @Param("endDate") LocalDateTime endDate);

    // Count open orders at a table: any active (not served/cancelled) OR served but unpaid
    @Query("SELECT COUNT(o) FROM Order o WHERE o.restaurant.id = :restaurantId AND o.tableNumber = :tableNumber " +
           "AND (o.status IN ('PENDING','CONFIRMED','PREPARING','READY') OR (o.status = 'SERVED' AND o.paymentStatus <> 'PAID'))")
    long countOpenOrdersForTable(@Param("restaurantId") Long restaurantId,
                                 @Param("tableNumber") String tableNumber);
}
