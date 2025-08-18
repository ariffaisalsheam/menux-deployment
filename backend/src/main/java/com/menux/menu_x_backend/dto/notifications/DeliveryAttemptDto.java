package com.menux.menu_x_backend.dto.notifications;

import com.menux.menu_x_backend.entity.DeliveryAttempt;

import java.time.LocalDateTime;

public class DeliveryAttemptDto {
    private Long id;
    private Long notificationId;
    private DeliveryAttempt.Channel channel;
    private DeliveryAttempt.Status status;
    private String providerMessageId;
    private String responseCode;
    private String errorMessage;
    private LocalDateTime attemptAt;
    private Integer retryCount;

    public static DeliveryAttemptDto from(DeliveryAttempt a) {
        DeliveryAttemptDto dto = new DeliveryAttemptDto();
        dto.id = a.getId();
        dto.notificationId = a.getNotificationId();
        dto.channel = a.getChannel();
        dto.status = a.getStatus();
        dto.providerMessageId = a.getProviderMessageId();
        dto.responseCode = a.getResponseCode();
        dto.errorMessage = a.getErrorMessage();
        dto.attemptAt = a.getAttemptAt();
        dto.retryCount = a.getRetryCount();
        return dto;
    }

    public Long getId() { return id; }
    public Long getNotificationId() { return notificationId; }
    public DeliveryAttempt.Channel getChannel() { return channel; }
    public DeliveryAttempt.Status getStatus() { return status; }
    public String getProviderMessageId() { return providerMessageId; }
    public String getResponseCode() { return responseCode; }
    public String getErrorMessage() { return errorMessage; }
    public LocalDateTime getAttemptAt() { return attemptAt; }
    public Integer getRetryCount() { return retryCount; }
}
