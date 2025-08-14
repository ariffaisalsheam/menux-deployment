package com.menux.menu_x_backend.dto.ai;

import com.menux.menu_x_backend.entity.AIProviderConfig;

import java.time.LocalDateTime;

public class AIProviderConfigDTO {
    private Long id;
    private String name;
    private AIProviderConfig.ProviderType type;
    private String maskedApiKey;
    private String providerId;
    private String endpoint;
    private String model;
    private String modelDisplayName;
    private Boolean isActive;
    private Boolean isPrimary;
    private String settings;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastTestedAt;
    private AIProviderConfig.TestStatus testStatus;
    private String testErrorMessage;

    // Constructors
    public AIProviderConfigDTO() {}

    public AIProviderConfigDTO(AIProviderConfig config, String maskedApiKey) {
        this.id = config.getId();
        this.name = config.getName();
        this.type = config.getType();
        this.maskedApiKey = maskedApiKey;
        this.providerId = config.getProviderId();
        this.endpoint = config.getEndpoint();
        this.model = config.getModel();
        this.modelDisplayName = config.getModelDisplayName();
        this.isActive = config.getIsActive();
        this.isPrimary = config.getIsPrimary();
        this.settings = config.getSettings();
        this.createdAt = config.getCreatedAt();
        this.updatedAt = config.getUpdatedAt();
        this.lastTestedAt = config.getLastTestedAt();
        this.testStatus = config.getTestStatus();
        this.testErrorMessage = config.getTestErrorMessage();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public AIProviderConfig.ProviderType getType() { return type; }
    public void setType(AIProviderConfig.ProviderType type) { this.type = type; }

    public String getMaskedApiKey() { return maskedApiKey; }
    public void setMaskedApiKey(String maskedApiKey) { this.maskedApiKey = maskedApiKey; }

    public String getProviderId() { return providerId; }
    public void setProviderId(String providerId) { this.providerId = providerId; }

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getModelDisplayName() { return modelDisplayName; }
    public void setModelDisplayName(String modelDisplayName) { this.modelDisplayName = modelDisplayName; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Boolean getIsPrimary() { return isPrimary; }
    public void setIsPrimary(Boolean isPrimary) { this.isPrimary = isPrimary; }

    public String getSettings() { return settings; }
    public void setSettings(String settings) { this.settings = settings; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getLastTestedAt() { return lastTestedAt; }
    public void setLastTestedAt(LocalDateTime lastTestedAt) { this.lastTestedAt = lastTestedAt; }

    public AIProviderConfig.TestStatus getTestStatus() { return testStatus; }
    public void setTestStatus(AIProviderConfig.TestStatus testStatus) { this.testStatus = testStatus; }

    public String getTestErrorMessage() { return testErrorMessage; }
    public void setTestErrorMessage(String testErrorMessage) { this.testErrorMessage = testErrorMessage; }
}
