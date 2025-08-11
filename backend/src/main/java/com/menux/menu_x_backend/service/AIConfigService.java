package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.dto.ai.*;
import com.menux.menu_x_backend.entity.AIProviderConfig;
import com.menux.menu_x_backend.repository.AIProviderConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AIConfigService {

    @Autowired
    private AIProviderConfigRepository repository;

    @Autowired
    private EncryptionService encryptionService;

    @Autowired
    private AIProviderTestService aiProviderTestService;

    public List<AIProviderConfigDTO> getAllProviders() {
        return repository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AIProviderConfigDTO> getActiveProviders() {
        return repository.findByIsActiveTrue().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public AIProviderConfigDTO getProviderById(Long id) {
        AIProviderConfig config = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("AI Provider not found with id: " + id));
        return convertToDTO(config);
    }

    @Transactional
    public AIProviderConfigDTO createProvider(CreateAIProviderRequest request) {
        if (repository.existsByName(request.getName())) {
            throw new RuntimeException("Provider with name '" + request.getName() + "' already exists");
        }

        String encryptedApiKey = encryptionService.encrypt(request.getApiKey());

        AIProviderConfig config = new AIProviderConfig();
        config.setName(request.getName());
        config.setType(request.getType());
        config.setEncryptedApiKey(encryptedApiKey);
        config.setEndpoint(request.getEndpoint());
        config.setIsActive(request.getIsActive());
        config.setSettings(request.getSettings());

        if (Boolean.TRUE.equals(request.getIsPrimary()) && Boolean.TRUE.equals(request.getIsActive())) {
            repository.clearAllPrimaryFlags();
            config.setIsPrimary(true);
        } else {
            config.setIsPrimary(false);
        }

        config = repository.save(config);
        return convertToDTO(config);
    }

    @Transactional
    public AIProviderConfigDTO updateProvider(Long id, UpdateAIProviderRequest request) {
        AIProviderConfig config = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("AI Provider not found with id: " + id));

        if (request.getName() != null && !request.getName().equals(config.getName())) {
            if (repository.existsByNameAndIdNot(request.getName(), id)) {
                throw new RuntimeException("Provider with name '" + request.getName() + "' already exists");
            }
            config.setName(request.getName());
        }

        if (request.getApiKey() != null && !request.getApiKey().trim().isEmpty()) {
            String encryptedApiKey = encryptionService.encrypt(request.getApiKey());
            config.setEncryptedApiKey(encryptedApiKey);
        }

        if (request.getEndpoint() != null) {
            config.setEndpoint(request.getEndpoint());
        }
        if (request.getIsActive() != null) {
            config.setIsActive(request.getIsActive());
        }
        if (request.getSettings() != null) {
            config.setSettings(request.getSettings());
        }

        if (request.getIsPrimary() != null) {
            if (Boolean.TRUE.equals(request.getIsPrimary()) && Boolean.TRUE.equals(config.getIsActive())) {
                repository.clearAllPrimaryFlags();
                config.setIsPrimary(true);
            } else {
                config.setIsPrimary(false);
            }
        }

        config = repository.save(config);
        return convertToDTO(config);
    }

    @Transactional
    public void deleteProvider(Long id) {
        AIProviderConfig config = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("AI Provider not found with id: " + id));
        repository.delete(config);
    }

    @Transactional
    public AIProviderConfigDTO setPrimaryProvider(Long id) {
        AIProviderConfig config = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("AI Provider not found with id: " + id));

        if (!Boolean.TRUE.equals(config.getIsActive())) {
            throw new RuntimeException("Cannot set inactive provider as primary");
        }

        repository.clearAllPrimaryFlags();
        config.setIsPrimary(true);
        config = repository.save(config);

        return convertToDTO(config);
    }

    public AIProviderTestResult testProvider(Long id) {
        AIProviderConfig config = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("AI Provider not found with id: " + id));

        try {
            String apiKey = encryptionService.decrypt(config.getEncryptedApiKey());
            long start = System.currentTimeMillis();
            AIProviderTestResult result = aiProviderTestService.testProvider(
                    config.getType(), apiKey, config.getEndpoint(), config.getSettings());
            long took = System.currentTimeMillis() - start;
            result.setResponseTimeMs(took);
            updateTestStatus(config, result);
            return result;
        } catch (Exception e) {
            AIProviderTestResult result = AIProviderTestResult.failure("Test failed: " + e.getMessage());
            updateTestStatus(config, result);
            return result;
        }
    }

    @Transactional
    protected void updateTestStatus(AIProviderConfig config, AIProviderTestResult result) {
        config.setLastTestedAt(LocalDateTime.now());
        config.setTestStatus(result.getStatus());
        config.setTestErrorMessage(Boolean.TRUE.equals(result.getSuccess()) ? null : result.getMessage());
        repository.save(config);
    }

    private AIProviderConfigDTO convertToDTO(AIProviderConfig config) {
        String maskedApiKey = encryptionService.maskEncryptedApiKey(config.getEncryptedApiKey());
        return new AIProviderConfigDTO(config, maskedApiKey);
    }
}
