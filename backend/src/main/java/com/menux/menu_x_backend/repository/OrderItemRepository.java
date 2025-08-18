package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    
    @Query(value = "SELECT mi.name FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE oi.id = :orderItemId", nativeQuery = true)
    String getMenuItemNameByOrderItemId(@Param("orderItemId") Long orderItemId);

    // Explicitly load items for a given order without relying on lazy initialization
    List<OrderItem> findByOrderId(Long orderId);

    // Top selling items by restaurant within a date range (served orders only)
    // Returns rows: [name(String), orders(Long), revenue(Double)]
    @Query(value = "\n" +
            "SELECT mi.name AS name,\n" +
            "       COUNT(DISTINCT o.id) AS orders,\n" +
            "       SUM(oi.quantity * oi.price) AS revenue\n" +
            "FROM order_items oi\n" +
            "JOIN orders o ON oi.order_id = o.id\n" +
            "JOIN menu_items mi ON oi.menu_item_id = mi.id\n" +
            "WHERE o.restaurant_id = :restaurantId\n" +
            "  AND o.status = 'SERVED'\n" +
            "  AND o.created_at BETWEEN :start AND :end\n" +
            "GROUP BY mi.name\n" +
            "ORDER BY revenue DESC\n" +
            "LIMIT 5\n", nativeQuery = true)
    List<Object[]> getTopItemsByRestaurantAndDateRange(
            @Param("restaurantId") Long restaurantId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
