package com.menux.menu_x_backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_provider_configs")
public class AIProviderConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Provider name is required")
    @Column(nullable = false)
    private String name;

    @NotNull(message = "Provider type is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProviderType type;

    @NotBlank(message = "API key is required")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String encryptedApiKey;

    @Column(columnDefinition = "TEXT")
    private String endpoint;

    @Column(nullable = false)
    private Boolean isActive = false;

    @Column(nullable = false)
    private Boolean isPrimary = false;

    @Column(columnDefinition = "TEXT")
    private String settings; // JSON string for provider-specific settings

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_tested_at")
    private LocalDateTime lastTestedAt;

    @Column(name = "test_status")
    @Enumerated(EnumType.STRING)
    private TestStatus testStatus;

    @Column(name = "test_error_message", columnDefinition = "TEXT")
    private String testErrorMessage;

    public enum ProviderType {
        GOOGLE_GEMINI,
        OPENROUTER,
        OPENAI,
        OPENAI_COMPATIBLE,
        Z_AI_GLM_4_5
    }

    public enum TestStatus {
        PENDING,
        SUCCESS,
        FAILED,
        TIMEOUT
    }

    // Constructors
    public AIProviderConfig() {}

    public AIProviderConfig(String name, ProviderType type, String encryptedApiKey) {
        this.name = name;
        this.type = type;
        this.encryptedApiKey = encryptedApiKey;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public ProviderType getType() { return type; }
    public void setType(ProviderType type) { this.type = type; }

    public String getEncryptedApiKey() { return encryptedApiKey; }
    public void setEncryptedApiKey(String encryptedApiKey) { this.encryptedApiKey = encryptedApiKey; }

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

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

    public TestStatus getTestStatus() { return testStatus; }
    public void setTestStatus(TestStatus testStatus) { this.testStatus = testStatus; }

    public String getTestErrorMessage() { return testErrorMessage; }
    public void setTestErrorMessage(String testErrorMessage) { this.testErrorMessage = testErrorMessage; }
}
