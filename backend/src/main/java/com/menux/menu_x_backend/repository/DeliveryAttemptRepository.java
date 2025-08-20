package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.DeliveryAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface DeliveryAttemptRepository extends JpaRepository<DeliveryAttempt, Long> {
    List<DeliveryAttempt> findByNotificationId(Long notificationId);

    long countByAttemptAtBetween(LocalDateTime start, LocalDateTime end);

    long countByStatusAndAttemptAtBetween(DeliveryAttempt.Status status, LocalDateTime start, LocalDateTime end);

    long countByAttemptAtGreaterThanEqualAndAttemptAtLessThan(LocalDateTime start, LocalDateTime end);

    long countByStatusAndAttemptAtGreaterThanEqualAndAttemptAtLessThan(DeliveryAttempt.Status status, LocalDateTime start, LocalDateTime end);
}
