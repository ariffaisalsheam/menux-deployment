package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.UserPushToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserPushTokenRepository extends JpaRepository<UserPushToken, Long> {
    Optional<UserPushToken> findByToken(String token);
    Optional<UserPushToken> findByUserIdAndToken(Long userId, String token);
    List<UserPushToken> findByUserIdAndIsActiveTrue(Long userId);
}
