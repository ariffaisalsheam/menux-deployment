package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.PlatformSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlatformSettingRepository extends JpaRepository<PlatformSetting, Long> {
    
    Optional<PlatformSetting> findByKey(String key);
    
    boolean existsByKey(String key);
    
    List<PlatformSetting> findByIsPublicTrue();
    
    List<PlatformSetting> findByIsSystemTrue();
    
    @Query("SELECT p FROM PlatformSetting p WHERE p.isSystem = false")
    List<PlatformSetting> findUserConfigurableSettings();
    
    @Query("SELECT p FROM PlatformSetting p WHERE p.key LIKE :keyPattern")
    List<PlatformSetting> findByKeyPattern(@Param("keyPattern") String keyPattern);
    
    void deleteByKeyAndIsSystemFalse(String key);
}
