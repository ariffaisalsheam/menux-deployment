package com.menux.menu_x_backend.dto.ai;

import com.menux.menu_x_backend.entity.AIProviderConfig;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateAIProviderRequest {
    
    @NotBlank(message = "Provider name is required")
    private String name;
    
    @NotNull(message = "Provider type is required")
    private AIProviderConfig.ProviderType type;
    
    @NotBlank(message = "API key is required")
    private String apiKey;
    
    private String endpoint;
    
    private Boolean isActive = false;
    
    private Boolean isPrimary = false;
    
    private String settings;

    // Constructors
    public CreateAIProviderRequest() {}

    public CreateAIProviderRequest(String name, AIProviderConfig.ProviderType type, String apiKey) {
        this.name = name;
        this.type = type;
        this.apiKey = apiKey;
    }

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public AIProviderConfig.ProviderType getType() { return type; }
    public void setType(AIProviderConfig.ProviderType type) { this.type = type; }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Boolean getIsPrimary() { return isPrimary; }
    public void setIsPrimary(Boolean isPrimary) { this.isPrimary = isPrimary; }

    public String getSettings() { return settings; }
    public void setSettings(String settings) { this.settings = settings; }
}
