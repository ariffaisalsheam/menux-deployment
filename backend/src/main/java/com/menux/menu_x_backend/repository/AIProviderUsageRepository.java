package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.AIProviderUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AIProviderUsageRepository extends JpaRepository<AIProviderUsage, Long> {
    Optional<AIProviderUsage> findByProviderId(Long providerId);
}
