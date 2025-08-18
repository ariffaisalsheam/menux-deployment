package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.RestaurantSubscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RestaurantSubscriptionRepository extends JpaRepository<RestaurantSubscription, Long> {
    Optional<RestaurantSubscription> findByRestaurantId(Long restaurantId);
    boolean existsByRestaurantId(Long restaurantId);
}
