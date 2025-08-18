package com.menux.menu_x_backend.dto.audit;

import java.time.LocalDateTime;

public class AuditLogDTO {
    public Long id;
    public Long actorId;
    public String action;
    public String resourceType;
    public String resourceId;
    public String metadata;
    public String ip;
    public String userAgent;
    public LocalDateTime createdAt;

    public AuditLogDTO() {}

    public AuditLogDTO(Long id, Long actorId, String action, String resourceType, String resourceId,
                       String metadata, String ip, String userAgent, LocalDateTime createdAt) {
        this.id = id;
        this.actorId = actorId;
        this.action = action;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.metadata = metadata;
        this.ip = ip;
        this.userAgent = userAgent;
        this.createdAt = createdAt;
    }
}
