package com.menux.menu_x_backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@jakarta.persistence.Table(name = "delivery_attempts")
public class DeliveryAttempt {

    public enum Channel { IN_APP, WEB_PUSH, EMAIL, SMS }
    public enum Status { PENDING, SENT, FAILED, RETRY, SUPPRESSED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "notification_id", nullable = false)
    private Long notificationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Channel channel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(name = "provider_message_id", length = 255)
    private String providerMessageId;

    @Column(name = "response_code", length = 50)
    private String responseCode;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    @Column(name = "attempt_at", nullable = false)
    private LocalDateTime attemptAt;

    @Column(name = "retry_count", nullable = false)
    private Integer retryCount = 0;

    @PrePersist
    protected void onCreate() { this.attemptAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public Long getNotificationId() { return notificationId; }
    public void setNotificationId(Long notificationId) { this.notificationId = notificationId; }
    public Channel getChannel() { return channel; }
    public void setChannel(Channel channel) { this.channel = channel; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public String getProviderMessageId() { return providerMessageId; }
    public void setProviderMessageId(String providerMessageId) { this.providerMessageId = providerMessageId; }
    public String getResponseCode() { return responseCode; }
    public void setResponseCode(String responseCode) { this.responseCode = responseCode; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public LocalDateTime getAttemptAt() { return attemptAt; }
    public void setAttemptAt(LocalDateTime attemptAt) { this.attemptAt = attemptAt; }
    public Integer getRetryCount() { return retryCount; }
    public void setRetryCount(Integer retryCount) { this.retryCount = retryCount; }
}
