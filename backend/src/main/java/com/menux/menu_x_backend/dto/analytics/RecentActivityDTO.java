package com.menux.menu_x_backend.dto.analytics;

import java.time.LocalDateTime;

public class RecentActivityDTO {
    private String type; // ORDER | MENU | FEEDBACK
    private String title;
    private String description;
    private LocalDateTime createdAt;

    public RecentActivityDTO() {}

    public RecentActivityDTO(String type, String title, String description, LocalDateTime createdAt) {
        this.type = type;
        this.title = title;
        this.description = description;
        this.createdAt = createdAt;
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
