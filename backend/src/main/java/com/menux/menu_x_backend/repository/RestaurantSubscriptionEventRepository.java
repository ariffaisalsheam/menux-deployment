package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.RestaurantSubscriptionEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RestaurantSubscriptionEventRepository extends JpaRepository<RestaurantSubscriptionEvent, Long> {
    List<RestaurantSubscriptionEvent> findBySubscriptionIdOrderByCreatedAtDesc(Long subscriptionId);
}
