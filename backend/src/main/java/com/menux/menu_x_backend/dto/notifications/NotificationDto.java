package com.menux.menu_x_backend.dto.notifications;

import com.menux.menu_x_backend.entity.Notification;

import java.time.LocalDateTime;

public class NotificationDto {
    private Long targetUserId;
    private Long id;
    private Notification.Type type;
    private String title;
    private String body;
    private String data;
    private Notification.Priority priority;
    private Notification.Status status;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;

    public static NotificationDto from(Notification n) {
        NotificationDto dto = new NotificationDto();
        dto.targetUserId = n.getTargetUserId();
        dto.id = n.getId();
        dto.type = n.getType();
        dto.title = n.getTitle();
        dto.body = n.getBody();
        dto.data = n.getData();
        dto.priority = n.getPriority();
        dto.status = n.getStatus();
        dto.readAt = n.getReadAt();
        dto.createdAt = n.getCreatedAt();
        return dto;
    }

    public Long getTargetUserId() { return targetUserId; }
    public Long getId() { return id; }
    public Notification.Type getType() { return type; }
    public String getTitle() { return title; }
    public String getBody() { return body; }
    public String getData() { return data; }
    public Notification.Priority getPriority() { return priority; }
    public Notification.Status getStatus() { return status; }
    public LocalDateTime getReadAt() { return readAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
