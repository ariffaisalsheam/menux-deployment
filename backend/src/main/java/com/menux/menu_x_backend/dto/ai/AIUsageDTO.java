package com.menux.menu_x_backend.dto.ai;

import java.time.LocalDateTime;

public class AIUsageDTO {
    private long providerId;
    private long totalCalls;
    private long totalErrors;
    private LocalDateTime lastCalledAt;

    public AIUsageDTO() {}

    public AIUsageDTO(long providerId, long totalCalls, long totalErrors, LocalDateTime lastCalledAt) {
        this.providerId = providerId;
        this.totalCalls = totalCalls;
        this.totalErrors = totalErrors;
        this.lastCalledAt = lastCalledAt;
    }

    public long getProviderId() { return providerId; }
    public void setProviderId(long providerId) { this.providerId = providerId; }

    public long getTotalCalls() { return totalCalls; }
    public void setTotalCalls(long totalCalls) { this.totalCalls = totalCalls; }

    public long getTotalErrors() { return totalErrors; }
    public void setTotalErrors(long totalErrors) { this.totalErrors = totalErrors; }

    public LocalDateTime getLastCalledAt() { return lastCalledAt; }
    public void setLastCalledAt(LocalDateTime lastCalledAt) { this.lastCalledAt = lastCalledAt; }
}
