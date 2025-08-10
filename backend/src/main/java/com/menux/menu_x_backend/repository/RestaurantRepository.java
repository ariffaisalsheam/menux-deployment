package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    
    Optional<Restaurant> findByOwnerId(Long ownerId);
    
    List<Restaurant> findByIsActiveTrue();
    
    List<Restaurant> findBySubscriptionPlan(Restaurant.SubscriptionPlan subscriptionPlan);
    
    @Query("SELECT r FROM Restaurant r WHERE r.isActive = true AND r.subscriptionPlan = :plan")
    List<Restaurant> findActiveRestaurantsByPlan(@Param("plan") Restaurant.SubscriptionPlan plan);
    
    @Query("SELECT COUNT(r) FROM Restaurant r WHERE r.isActive = true")
    long countActiveRestaurants();
    
    @Query("SELECT COUNT(r) FROM Restaurant r WHERE r.isActive = true AND r.subscriptionPlan = 'PRO'")
    long countProRestaurants();
    
    boolean existsByName(String name);
}
