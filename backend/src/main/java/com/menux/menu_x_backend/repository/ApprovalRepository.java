package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.Approval;
import com.menux.menu_x_backend.entity.ApprovalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalRepository extends JpaRepository<Approval, Long>, JpaSpecificationExecutor<Approval> {
    List<Approval> findByStatusOrderByCreatedAtDesc(ApprovalStatus status);
    List<Approval> findAllByOrderByCreatedAtDesc();
}
