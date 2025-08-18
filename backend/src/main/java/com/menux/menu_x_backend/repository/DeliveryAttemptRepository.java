package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.DeliveryAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeliveryAttemptRepository extends JpaRepository<DeliveryAttempt, Long> {
    List<DeliveryAttempt> findByNotificationId(Long notificationId);
}
