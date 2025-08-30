package com.menux.menu_x_backend.repository.rbac;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.menux.menu_x_backend.entity.rbac.RbacRole;

@Repository
public interface RbacRoleRepository extends JpaRepository<RbacRole, Long> {

    @Query("SELECT r FROM RbacRole r LEFT JOIN FETCH r.permissions WHERE r.name = :name")
    Optional<RbacRole> findByName(@Param("name") String name);

    @Query("SELECT r FROM RbacRole r LEFT JOIN FETCH r.permissions LEFT JOIN FETCH r.users WHERE r.id IN (SELECT ur.id FROM RbacRole ur JOIN ur.users u WHERE u.id = :userId)")
    List<RbacRole> findByUsers_Id(@Param("userId") Long userId);

    @Query("SELECT r FROM RbacRole r LEFT JOIN FETCH r.permissions")
    List<RbacRole> findAllWithPermissions();

    @Query("SELECT r FROM RbacRole r LEFT JOIN FETCH r.permissions WHERE r.id = :id")
    Optional<RbacRole> findByIdWithPermissions(@Param("id") Long id);
}
