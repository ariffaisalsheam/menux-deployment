package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByTargetUserIdOrderByCreatedAtDesc(Long targetUserId, Pageable pageable);
    Page<Notification> findByTargetUserIdAndReadAtIsNullOrderByCreatedAtDesc(Long targetUserId, Pageable pageable);

    long countByTargetUserIdAndReadAtIsNull(Long targetUserId);

    Optional<Notification> findByIdAndTargetUserId(Long id, Long targetUserId);

    List<Notification> findByTargetUserIdAndReadAtIsNull(Long targetUserId);

    // Admin: list recent notifications across all users
    Page<Notification> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // Delete a single notification for a user; returns number of rows deleted
    int deleteByIdAndTargetUserId(Long id, Long targetUserId);

    // Delete all notifications for a user; returns number of rows deleted
    int deleteByTargetUserId(Long targetUserId);

    // Admin: Delete notifications by date range; returns number of rows deleted
    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.createdAt >= :start AND n.createdAt <= :end")
    int deleteByCreatedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
