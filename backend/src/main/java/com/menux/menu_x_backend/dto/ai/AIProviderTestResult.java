package com.menux.menu_x_backend.dto.ai;

import com.menux.menu_x_backend.entity.AIProviderConfig;

import java.time.LocalDateTime;

public class AIProviderTestResult {
    private Boolean success;
    private String message;
    private AIProviderConfig.TestStatus status;
    private LocalDateTime testedAt;
    private Long responseTimeMs;
    private String usageInfo;

    // Constructors
    public AIProviderTestResult() {}

    public AIProviderTestResult(Boolean success, String message, AIProviderConfig.TestStatus status) {
        this.success = success;
        this.message = message;
        this.status = status;
        this.testedAt = LocalDateTime.now();
    }

    public static AIProviderTestResult success(String message) {
        return new AIProviderTestResult(true, message, AIProviderConfig.TestStatus.SUCCESS);
    }

    public static AIProviderTestResult failure(String message) {
        return new AIProviderTestResult(false, message, AIProviderConfig.TestStatus.FAILED);
    }

    public static AIProviderTestResult timeout(String message) {
        return new AIProviderTestResult(false, message, AIProviderConfig.TestStatus.TIMEOUT);
    }

    // Getters and Setters
    public Boolean getSuccess() { return success; }
    public void setSuccess(Boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public AIProviderConfig.TestStatus getStatus() { return status; }
    public void setStatus(AIProviderConfig.TestStatus status) { this.status = status; }

    public LocalDateTime getTestedAt() { return testedAt; }
    public void setTestedAt(LocalDateTime testedAt) { this.testedAt = testedAt; }

    public Long getResponseTimeMs() { return responseTimeMs; }
    public void setResponseTimeMs(Long responseTimeMs) { this.responseTimeMs = responseTimeMs; }

    public String getUsageInfo() { return usageInfo; }
    public void setUsageInfo(String usageInfo) { this.usageInfo = usageInfo; }
}
