package com.menux.menu_x_backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@jakarta.persistence.Table(name = "notification_preferences")
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "in_app_enabled", nullable = false)
    private Boolean inAppEnabled = true;

    @Column(name = "web_push_enabled", nullable = false)
    private Boolean webPushEnabled = false;

    @Column(name = "email_enabled", nullable = false)
    private Boolean emailEnabled = false;

    @Column(name = "sms_enabled", nullable = false)
    private Boolean smsEnabled = false;

    @Column(columnDefinition = "jsonb")
    private String overrides; // JSON string for per-type overrides

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Boolean getInAppEnabled() { return inAppEnabled; }
    public void setInAppEnabled(Boolean inAppEnabled) { this.inAppEnabled = inAppEnabled; }
    public Boolean getWebPushEnabled() { return webPushEnabled; }
    public void setWebPushEnabled(Boolean webPushEnabled) { this.webPushEnabled = webPushEnabled; }
    public Boolean getEmailEnabled() { return emailEnabled; }
    public void setEmailEnabled(Boolean emailEnabled) { this.emailEnabled = emailEnabled; }
    public Boolean getSmsEnabled() { return smsEnabled; }
    public void setSmsEnabled(Boolean smsEnabled) { this.smsEnabled = smsEnabled; }
    public String getOverrides() { return overrides; }
    public void setOverrides(String overrides) { this.overrides = overrides; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
