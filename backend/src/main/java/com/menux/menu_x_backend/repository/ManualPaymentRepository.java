package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.ManualPayment;
import com.menux.menu_x_backend.entity.ManualPayment.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ManualPaymentRepository extends JpaRepository<ManualPayment, Long> {
    Optional<ManualPayment> findByTrxId(String trxId);
    List<ManualPayment> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
    List<ManualPayment> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);
    List<ManualPayment> findByStatusOrderByCreatedAtDesc(Status status);
}
