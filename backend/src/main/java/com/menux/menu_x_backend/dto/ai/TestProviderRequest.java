package com.menux.menu_x_backend.dto.ai;

import com.menux.menu_x_backend.entity.AIProviderConfig;

public class TestProviderRequest {
    private AIProviderConfig.ProviderType type;
    private String apiKey;
    private String endpoint;
    private String model;
    private String settings;

    // Constructors
    public TestProviderRequest() {}

    public TestProviderRequest(AIProviderConfig.ProviderType type, String apiKey, String endpoint, String model, String settings) {
        this.type = type;
        this.apiKey = apiKey;
        this.endpoint = endpoint;
        this.model = model;
        this.settings = settings;
    }

    // Getters and Setters
    public AIProviderConfig.ProviderType getType() { return type; }
    public void setType(AIProviderConfig.ProviderType type) { this.type = type; }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getSettings() { return settings; }
    public void setSettings(String settings) { this.settings = settings; }
}
