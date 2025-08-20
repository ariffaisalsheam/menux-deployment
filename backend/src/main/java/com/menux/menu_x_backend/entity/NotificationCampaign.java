package com.menux.menu_x_backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@jakarta.persistence.Table(name = "notification_campaigns")
public class NotificationCampaign {

    public enum Status { DRAFT, SCHEDULED, RUNNING, PAUSED, COMPLETED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private NotificationTemplate template;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "segment_id", nullable = false)
    private NotificationSegment segment;

    @Column(name = "schedule_at")
    private LocalDateTime scheduleAt;

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

    // Getters/Setters
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public NotificationTemplate getTemplate() { return template; }
    public void setTemplate(NotificationTemplate template) { this.template = template; }
    public NotificationSegment getSegment() { return segment; }
    public void setSegment(NotificationSegment segment) { this.segment = segment; }
    public LocalDateTime getScheduleAt() { return scheduleAt; }
    public void setScheduleAt(LocalDateTime scheduleAt) { this.scheduleAt = scheduleAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
