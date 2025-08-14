package com.menux.menu_x_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_provider_usage")
public class AIProviderUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "provider_id", nullable = false)
    private Long providerId;

    @Column(name = "total_calls", nullable = false)
    private Long totalCalls = 0L;

    @Column(name = "total_errors", nullable = false)
    private Long totalErrors = 0L;

    @Column(name = "last_called_at")
    private LocalDateTime lastCalledAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProviderId() { return providerId; }
    public void setProviderId(Long providerId) { this.providerId = providerId; }

    public Long getTotalCalls() { return totalCalls; }
    public void setTotalCalls(Long totalCalls) { this.totalCalls = totalCalls; }

    public Long getTotalErrors() { return totalErrors; }
    public void setTotalErrors(Long totalErrors) { this.totalErrors = totalErrors; }

    public LocalDateTime getLastCalledAt() { return lastCalledAt; }
    public void setLastCalledAt(LocalDateTime lastCalledAt) { this.lastCalledAt = lastCalledAt; }
}
