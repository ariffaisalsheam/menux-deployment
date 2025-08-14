package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.dto.ai.AIUsageDTO;
import com.menux.menu_x_backend.entity.AIProviderUsage;
import com.menux.menu_x_backend.repository.AIProviderUsageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class AIUsageService {

    private static final Logger logger = LoggerFactory.getLogger(AIUsageService.class);
    private final AIProviderUsageRepository usageRepository;

    public AIUsageService(AIProviderUsageRepository usageRepository) {
        this.usageRepository = usageRepository;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void recordUse(Long providerId) {
        try {
            AIProviderUsage usage = usageRepository.findByProviderId(providerId).orElseGet(() -> {
                AIProviderUsage u = new AIProviderUsage();
                u.setProviderId(providerId);
                return u;
            });
            usage.setTotalCalls(usage.getTotalCalls() + 1);
            usage.setLastCalledAt(LocalDateTime.now());
            usageRepository.save(usage);
            logger.debug("Recorded usage for provider: {}", providerId);
        } catch (Exception e) {
            logger.error("Failed to record usage for provider: {}, error: {}", providerId, e.getMessage());
            // Don't rethrow - usage recording should not fail the main operation
        }
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void recordError(Long providerId) {
        try {
            AIProviderUsage usage = usageRepository.findByProviderId(providerId).orElseGet(() -> {
                AIProviderUsage u = new AIProviderUsage();
                u.setProviderId(providerId);
                return u;
            });
            usage.setTotalErrors(usage.getTotalErrors() + 1);
            usage.setLastCalledAt(LocalDateTime.now());
            usageRepository.save(usage);
            logger.debug("Recorded error for provider: {}", providerId);
        } catch (Exception e) {
            logger.error("Failed to record error for provider: {}, error: {}", providerId, e.getMessage());
            // Don't rethrow - usage recording should not fail the main operation
        }
    }

    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    public Map<Long, AIUsageDTO> getUsageStatistics() {
        try {
            Map<Long, AIUsageDTO> map = new HashMap<>();
            for (AIProviderUsage usage : usageRepository.findAll()) {
                map.put(usage.getProviderId(), new AIUsageDTO(
                        usage.getProviderId(),
                        usage.getTotalCalls(),
                        usage.getTotalErrors(),
                        usage.getLastCalledAt()
                ));
            }
            logger.debug("Retrieved usage statistics for {} providers", map.size());
            return map;
        } catch (Exception e) {
            logger.error("Failed to retrieve usage statistics: {}", e.getMessage());
            // Return empty map instead of failing
            return new HashMap<>();
        }
    }
}


