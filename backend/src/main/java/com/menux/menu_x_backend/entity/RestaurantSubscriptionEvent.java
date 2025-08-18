package com.menux.menu_x_backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@jakarta.persistence.Table(name = "restaurant_subscription_events")
public class RestaurantSubscriptionEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "subscription_id", nullable = false)
    private Long subscriptionId;

    @Column(name = "event_type", nullable = false, length = 32)
    private String eventType;

    // Store JSON as text; column is jsonb in DB
    @Column(name = "metadata", columnDefinition = "text")
    private String metadata;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public RestaurantSubscriptionEvent() {}

    public RestaurantSubscriptionEvent(Long subscriptionId, String eventType, String metadata) {
        this.subscriptionId = subscriptionId;
        this.eventType = eventType;
        this.metadata = metadata;
    }

    // Getters and setters
    public Long getId() { return id; }
    public Long getSubscriptionId() { return subscriptionId; }
    public void setSubscriptionId(Long subscriptionId) { this.subscriptionId = subscriptionId; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
