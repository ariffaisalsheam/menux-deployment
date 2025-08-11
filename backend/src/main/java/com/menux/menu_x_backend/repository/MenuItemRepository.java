package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    
    List<MenuItem> findByMenuId(Long menuId);
    
    List<MenuItem> findByMenuIdAndIsAvailableTrue(Long menuId);

    @Query("SELECT mi FROM MenuItem mi WHERE mi.menu.restaurant.id = :restaurantId")
    List<MenuItem> findByRestaurantId(@Param("restaurantId") Long restaurantId);

    @Query("SELECT mi FROM MenuItem mi WHERE mi.menu.restaurant.id = :restaurantId AND mi.isAvailable = true")
    List<MenuItem> findByRestaurantIdAndIsAvailableTrue(@Param("restaurantId") Long restaurantId);
    
    List<MenuItem> findByCategory(MenuItem.Category category);
    
    @Query("SELECT mi FROM MenuItem mi WHERE mi.menu.restaurant.id = :restaurantId AND mi.category = :category")
    List<MenuItem> findByRestaurantIdAndCategory(@Param("restaurantId") Long restaurantId, @Param("category") MenuItem.Category category);

    @Query("SELECT mi FROM MenuItem mi WHERE mi.menu.restaurant.id = :restaurantId AND mi.isAvailable = true AND mi.category = :category")
    List<MenuItem> findByRestaurantIdAndCategoryAndIsAvailableTrue(@Param("restaurantId") Long restaurantId, @Param("category") MenuItem.Category category);

    @Query("SELECT COUNT(mi) FROM MenuItem mi WHERE mi.menu.restaurant.id = :restaurantId")
    long countByRestaurantId(@Param("restaurantId") Long restaurantId);

    @Query("SELECT COUNT(mi) FROM MenuItem mi WHERE mi.menu.restaurant.id = :restaurantId AND mi.isAvailable = true")
    long countIsAvailableByRestaurantId(@Param("restaurantId") Long restaurantId);
}
