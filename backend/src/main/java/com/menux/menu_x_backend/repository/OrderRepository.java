package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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
}
