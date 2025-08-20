package com.menux.menu_x_backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;

@Entity
@jakarta.persistence.Table(name = "notification_segments")
public class NotificationSegment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @JsonIgnore
    @Column(name = "filters", columnDefinition = "jsonb")
    private String filtersJson;

    @Column(name = "estimated_count")
    private Integer estimatedCount;

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

    // Expose filters as object for API contract
    @Transient
    @JsonProperty("filters")
    public Map<String, Object> getFilters() {
        // MVP: do not parse; return empty object when missing
        return Collections.emptyMap();
    }

    public void setFilters(Map<String, Object> filters) {
        // MVP: store as empty JSON
        this.filtersJson = "{}";
    }

    // Getters/Setters
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getFiltersJson() { return filtersJson; }
    public void setFiltersJson(String filtersJson) { this.filtersJson = filtersJson; }
    public Integer getEstimatedCount() { return estimatedCount; }
    public void setEstimatedCount(Integer estimatedCount) { this.estimatedCount = estimatedCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
