package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuRepository extends JpaRepository<Menu, Long> {
    
    List<Menu> findByRestaurantId(Long restaurantId);
    
    Optional<Menu> findByRestaurantIdAndIsActiveTrue(Long restaurantId);
    
    @Query("SELECT m FROM Menu m WHERE m.restaurant.id = :restaurantId AND m.isActive = true")
    List<Menu> findActiveMenusByRestaurant(@Param("restaurantId") Long restaurantId);
    
    @Query("SELECT COUNT(m) FROM Menu m WHERE m.restaurant.id = :restaurantId")
    long countByRestaurantId(@Param("restaurantId") Long restaurantId);
}
