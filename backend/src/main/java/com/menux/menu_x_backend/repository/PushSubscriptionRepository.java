package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {
    Optional<PushSubscription> findByEndpoint(String endpoint);
    List<PushSubscription> findByUserIdAndIsActiveTrue(Long userId);
    Optional<PushSubscription> findByIdAndUserId(Long id, Long userId);
}
