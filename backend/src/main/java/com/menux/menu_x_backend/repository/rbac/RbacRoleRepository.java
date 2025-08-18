package com.menux.menu_x_backend.repository.rbac;

import com.menux.menu_x_backend.entity.rbac.RbacRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RbacRoleRepository extends JpaRepository<RbacRole, Long> {
    Optional<RbacRole> findByName(String name);
    List<RbacRole> findByUsers_Id(Long userId);
}
