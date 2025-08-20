package com.menux.menu_x_backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonValue;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@jakarta.persistence.Table(name = "notification_templates")
public class NotificationTemplate {

    public enum Channel {
        PUSH, EMAIL, IN_APP;
        @JsonValue
        public String toJson() { return name().toLowerCase(); }
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Channel channel;

    @Column(length = 255)
    private String title;

    @Column(columnDefinition = "text", nullable = false)
    private String body;

    // Stored as JSONB in DB, but exposed as array via getters/setters
    @JsonIgnore
    @Column(name = "variables", columnDefinition = "jsonb")
    private String variablesJson;

    @Column(nullable = false)
    private Boolean enabled = Boolean.TRUE;

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

    // Computed JSON exposure
    @Transient
    @JsonProperty("variables")
    public List<String> getVariables() {
        if (variablesJson == null || variablesJson.isBlank()) return new ArrayList<>();
        // naive parse: remove brackets/quotes; kept simple for MVP
        try {
            String s = variablesJson.trim();
            if (s.startsWith("[")) s = s.substring(1);
            if (s.endsWith("]")) s = s.substring(0, s.length()-1);
            if (s.isBlank()) return new ArrayList<>();
            String[] parts = s.split(",");
            List<String> list = new ArrayList<>();
            for (String p : parts) {
                String v = p.trim();
                if (v.startsWith("\"") && v.endsWith("\"")) v = v.substring(1, v.length()-1);
                if (!v.isEmpty()) list.add(v);
            }
            return list;
        } catch (Exception ignore) {
            return new ArrayList<>();
        }
    }

    public void setVariables(List<String> vars) {
        if (vars == null || vars.isEmpty()) {
            this.variablesJson = "[]";
        } else {
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < vars.size(); i++) {
                if (i > 0) sb.append(',');
                String v = vars.get(i) == null ? "" : vars.get(i).replace("\"", "\\\"");
                sb.append('"').append(v).append('"');
            }
            sb.append(']');
            this.variablesJson = sb.toString();
        }
    }

    // Getters/Setters
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Channel getChannel() { return channel; }
    public void setChannel(Channel channel) { this.channel = channel; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public String getVariablesJson() { return variablesJson; }
    public void setVariablesJson(String variablesJson) { this.variablesJson = variablesJson; }
    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
