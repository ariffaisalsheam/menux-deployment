package com.menux.menu_x_backend.dto.ai;

public class UpdateAIProviderRequest {
    
    private String name;
    private String apiKey; // Only include if updating
    private String endpoint;
    private String providerId;
    private String model;
    private String modelDisplayName;
    private Boolean isActive;
    private Boolean isPrimary;
    private String settings;

    // Constructors
    public UpdateAIProviderRequest() {}

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

    public String getProviderId() { return providerId; }
    public void setProviderId(String providerId) { this.providerId = providerId; }

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
}
