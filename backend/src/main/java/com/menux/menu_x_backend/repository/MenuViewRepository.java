package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.MenuView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MenuViewRepository extends JpaRepository<MenuView, Long> {
    
    // Count total menu views for a restaurant
    long countByRestaurantId(Long restaurantId);
    
    // Count menu views in date range
    long countByRestaurantIdAndCreatedAtBetween(Long restaurantId, LocalDateTime start, LocalDateTime end);
    
    // Count QR code scans specifically
    long countByRestaurantIdAndViewType(Long restaurantId, MenuView.ViewType viewType);
    
    // Count QR code scans in date range
    long countByRestaurantIdAndViewTypeAndCreatedAtBetween(
        Long restaurantId, MenuView.ViewType viewType, LocalDateTime start, LocalDateTime end);
    
    // Get most viewed menu items
    @Query("SELECT mv.menuItemId, COUNT(mv) as viewCount " +
           "FROM MenuView mv " +
           "WHERE mv.restaurantId = :restaurantId " +
           "AND mv.menuItemId IS NOT NULL " +
           "AND mv.viewType = 'ITEM_VIEW' " +
           "GROUP BY mv.menuItemId " +
           "ORDER BY viewCount DESC")
    List<Object[]> findMostViewedMenuItems(@Param("restaurantId") Long restaurantId);
    
    // Get most viewed menu items in date range
    @Query("SELECT mv.menuItemId, COUNT(mv) as viewCount " +
           "FROM MenuView mv " +
           "WHERE mv.restaurantId = :restaurantId " +
           "AND mv.menuItemId IS NOT NULL " +
           "AND mv.viewType = 'ITEM_VIEW' " +
           "AND mv.createdAt BETWEEN :start AND :end " +
           "GROUP BY mv.menuItemId " +
           "ORDER BY viewCount DESC")
    List<Object[]> findMostViewedMenuItemsInRange(
        @Param("restaurantId") Long restaurantId, 
        @Param("start") LocalDateTime start, 
        @Param("end") LocalDateTime end);
    
    // Get daily view counts for the past week
    @Query("SELECT DATE(mv.createdAt) as viewDate, COUNT(mv) as viewCount " +
           "FROM MenuView mv " +
           "WHERE mv.restaurantId = :restaurantId " +
           "AND mv.createdAt >= :start " +
           "GROUP BY DATE(mv.createdAt) " +
           "ORDER BY viewDate")
    List<Object[]> findDailyViewCounts(@Param("restaurantId") Long restaurantId, @Param("start") LocalDateTime start);
    
    // Get hourly view distribution
    @Query("SELECT HOUR(mv.createdAt) as hour, COUNT(mv) as viewCount " +
           "FROM MenuView mv " +
           "WHERE mv.restaurantId = :restaurantId " +
           "AND mv.createdAt >= :start " +
           "GROUP BY HOUR(mv.createdAt) " +
           "ORDER BY hour")
    List<Object[]> findHourlyViewDistribution(@Param("restaurantId") Long restaurantId, @Param("start") LocalDateTime start);
    
    // Get hourly view distribution within a specific date window (e.g., a single day)
    @Query("SELECT HOUR(mv.createdAt) as hour, COUNT(mv) as viewCount " +
           "FROM MenuView mv " +
           "WHERE mv.restaurantId = :restaurantId " +
           "AND mv.createdAt BETWEEN :start AND :end " +
           "GROUP BY HOUR(mv.createdAt) " +
           "ORDER BY hour")
    List<Object[]> findHourlyViewDistributionBetween(
        @Param("restaurantId") Long restaurantId,
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end);
    
    // Count unique visitors (by IP) in date range
    @Query("SELECT COUNT(DISTINCT mv.visitorIp) " +
           "FROM MenuView mv " +
           "WHERE mv.restaurantId = :restaurantId " +
           "AND mv.createdAt BETWEEN :start AND :end " +
           "AND mv.visitorIp IS NOT NULL")
    long countUniqueVisitorsInRange(@Param("restaurantId") Long restaurantId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
