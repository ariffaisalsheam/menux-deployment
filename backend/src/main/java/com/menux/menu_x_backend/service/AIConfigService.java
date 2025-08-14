package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.dto.ai.*;
import com.menux.menu_x_backend.entity.AIProviderConfig;
import com.menux.menu_x_backend.repository.AIProviderConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Arrays;
import java.util.stream.Collectors;

@Service
public class AIConfigService {

    @Autowired
    private AIProviderConfigRepository repository;

    @Autowired
    private EncryptionService encryptionService;

    @Autowired
    private AIProviderTestService aiProviderTestService;

    @Autowired
    private ExternalApiResilienceService resilienceService;

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
        config.setProviderId(request.getProviderId());
        config.setEndpoint(request.getEndpoint());
        config.setModel(request.getModel());
        config.setModelDisplayName(request.getModelDisplayName());
        config.setIsActive(request.getIsActive());
        if (config.getProviderId() != null && !config.getProviderId().matches("^[a-zA-Z0-9-]+$")) {
            throw new RuntimeException("Provider ID must be alphanumeric with optional hyphens and no spaces");
        }
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
                throw new RuntimeException("Another provider with the same name already exists");
            }
            config.setName(request.getName());
        }

        // Type is immutable to avoid breaking provider semantics in runtime
        // if (request.getType() != null) config.setType(request.getType());
        if (request.getEndpoint() != null) config.setEndpoint(request.getEndpoint());
        if (request.getModel() != null) config.setModel(request.getModel());
        if (request.getModelDisplayName() != null) config.setModelDisplayName(request.getModelDisplayName());
        if (request.getSettings() != null) config.setSettings(request.getSettings());
        if (request.getIsActive() != null) config.setIsActive(request.getIsActive());
        if (request.getApiKey() != null && !request.getApiKey().isBlank()) {
            config.setEncryptedApiKey(encryptionService.encrypt(request.getApiKey()));
        }

        if (Boolean.TRUE.equals(request.getIsPrimary()) && Boolean.TRUE.equals(config.getIsActive())) {
            repository.clearAllPrimaryFlags();
            config.setIsPrimary(true);
        }

        config.setUpdatedAt(java.time.LocalDateTime.now());
        config = repository.save(config);
        return convertToDTO(config);
    }

    @Transactional
    public void deleteProvider(Long id) {
        repository.deleteById(id);
    }

    public AIProviderTestResult testProvider(Long id) {
        AIProviderConfig config = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("AI Provider not found with id: " + id));
        String apiKey = encryptionService.decrypt(config.getEncryptedApiKey());
        AIProviderTestResult result = aiProviderTestService.testProvider(
                config.getType(), apiKey, config.getEndpoint(), config.getSettings(), config.getModel());

        // Reset circuit breaker if test succeeds
        if (Boolean.TRUE.equals(result.getSuccess())) {
            String serviceName = config.getType().toString().toLowerCase().replace("_glm_4_5", "");
            resilienceService.resetCircuitBreaker(serviceName);
        }

        config.setLastTestedAt(java.time.LocalDateTime.now());
        config.setTestStatus(Boolean.TRUE.equals(result.getSuccess()) ? AIProviderConfig.TestStatus.SUCCESS : AIProviderConfig.TestStatus.FAILED);
        config.setTestErrorMessage(Boolean.TRUE.equals(result.getSuccess()) ? null : result.getMessage());
        repository.save(config);
        return result;
    }

    public AIProviderTestResult testProviderConfiguration(TestProviderRequest request) {
        return aiProviderTestService.testProvider(request.getType(), request.getApiKey(), request.getEndpoint(), request.getSettings(), request.getModel());
    }

    @Transactional
    public AIProviderConfigDTO setPrimaryProvider(Long id) {
        AIProviderConfig config = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("AI Provider not found with id: " + id));
        if (!Boolean.TRUE.equals(config.getIsActive())) {
            throw new RuntimeException("Cannot set an inactive provider as primary");
        }
        repository.clearAllPrimaryFlags();
        config.setIsPrimary(true);
        config.setUpdatedAt(LocalDateTime.now());
        repository.save(config);
        return convertToDTO(config);
    }

    public Map<String, List<String>> getAvailableModels() {
        Map<String, List<String>> modelsByProvider = new HashMap<>();

        modelsByProvider.put("GOOGLE_GEMINI", Arrays.asList(
                "gemini-2.5-pro",
                "gemini-2.5-flash"
        ));

        modelsByProvider.put("OPENAI", Arrays.asList(
                "o4",
                "o4-mini",
                "gpt-4o",
                "gpt-4o-mini"
        ));

        // Restrict Z.AI to only glm-4.5-flash
        modelsByProvider.put("Z_AI_GLM_4_5", Arrays.asList(
                "glm-4.5-flash"
        ));

        modelsByProvider.put("OPENROUTER", Arrays.asList(
                "anthropic/claude-3.5-sonnet",
                "anthropic/claude-3.5-haiku",
                "openai/gpt-4o",
                "google/gemini-2.5-pro",
                "meta-llama/llama-3.1-8b-instruct",
                "mistralai/mistral-7b-instruct"
        ));

        modelsByProvider.put("OPENAI_COMPATIBLE", Arrays.asList(
                "gpt-4o-mini",
                "llama3",
                "mistral"
        ));

        return modelsByProvider;
    }

    private AIProviderConfigDTO convertToDTO(AIProviderConfig config) {
        String maskedApiKey = encryptionService.maskEncryptedApiKey(config.getEncryptedApiKey());
        return new AIProviderConfigDTO(config, maskedApiKey);
    }


}
