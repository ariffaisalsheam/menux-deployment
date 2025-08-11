package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.AIProviderConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AIProviderConfigRepository extends JpaRepository<AIProviderConfig, Long> {
    boolean existsByName(String name);
    boolean existsByNameAndIdNot(String name, Long id);

    List<AIProviderConfig> findByIsActiveTrue();

    @Query("select p from AIProviderConfig p where p.isActive = true order by p.isPrimary desc, p.updatedAt desc nulls last")
    List<AIProviderConfig> findActiveProvidersOrderedByPriority();

    @Modifying
    @Query("update AIProviderConfig p set p.isPrimary = false where p.isPrimary = true")
    void clearAllPrimaryFlags();
}
