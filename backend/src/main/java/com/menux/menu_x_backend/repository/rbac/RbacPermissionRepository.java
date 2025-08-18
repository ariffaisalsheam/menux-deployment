package com.menux.menu_x_backend.repository.rbac;

import com.menux.menu_x_backend.entity.rbac.RbacPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RbacPermissionRepository extends JpaRepository<RbacPermission, String> {
}
