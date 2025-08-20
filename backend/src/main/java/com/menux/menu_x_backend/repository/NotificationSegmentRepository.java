package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.NotificationSegment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationSegmentRepository extends JpaRepository<NotificationSegment, Long> {
}
