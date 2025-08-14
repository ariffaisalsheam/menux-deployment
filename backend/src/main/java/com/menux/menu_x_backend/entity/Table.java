package com.menux.menu_x_backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@jakarta.persistence.Table(name = "restaurant_tables")
public class Table {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    @JsonIgnore
    private Restaurant restaurant;

    @Column(name = "table_number", nullable = false)
    private String tableNumber; // Supports both numeric (1, 2, 3) and named (A1, B2, VIP-1)

    @Column(name = "table_name")
    private String tableName; // Optional display name

    @Column(name = "capacity")
    private Integer capacity; // Number of seats

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TableStatus status = TableStatus.AVAILABLE;

    @Column(name = "qr_code_url")
    private String qrCodeUrl; // URL to the generated QR code image

    @Column(name = "qr_code_generated_at")
    private LocalDateTime qrCodeGeneratedAt;

    @Column(name = "location_description")
    private String locationDescription; // e.g., "Near window", "Corner table", "Patio"

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public Table() {
        this.createdAt = LocalDateTime.now();
    }

    public Table(Restaurant restaurant, String tableNumber) {
        this();
        this.restaurant = restaurant;
        this.tableNumber = tableNumber;
    }

    // Enums
    public enum TableStatus {
        AVAILABLE,    // Table is free and ready for customers
        OCCUPIED,     // Customers are currently seated
        RESERVED,     // Table is reserved for a specific time
        CLEANING,     // Table is being cleaned/prepared
        OUT_OF_ORDER  // Table is temporarily unavailable
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Restaurant getRestaurant() { return restaurant; }
    public void setRestaurant(Restaurant restaurant) { this.restaurant = restaurant; }

    public String getTableNumber() { return tableNumber; }
    public void setTableNumber(String tableNumber) { this.tableNumber = tableNumber; }

    public String getTableName() { return tableName; }
    public void setTableName(String tableName) { this.tableName = tableName; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }

    public TableStatus getStatus() { return status; }
    public void setStatus(TableStatus status) { this.status = status; }

    public String getQrCodeUrl() { return qrCodeUrl; }
    public void setQrCodeUrl(String qrCodeUrl) { this.qrCodeUrl = qrCodeUrl; }

    public LocalDateTime getQrCodeGeneratedAt() { return qrCodeGeneratedAt; }
    public void setQrCodeGeneratedAt(LocalDateTime qrCodeGeneratedAt) { this.qrCodeGeneratedAt = qrCodeGeneratedAt; }

    public String getLocationDescription() { return locationDescription; }
    public void setLocationDescription(String locationDescription) { this.locationDescription = locationDescription; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Helper methods
    public String getDisplayName() {
        if (tableName != null && !tableName.trim().isEmpty()) {
            return tableName;
        }
        return "Table " + tableNumber;
    }

    public boolean isAvailable() {
        return isActive && status == TableStatus.AVAILABLE;
    }

    public boolean isOccupied() {
        return isActive && status == TableStatus.OCCUPIED;
    }

    // Lifecycle callbacks
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return "Table{" +
                "id=" + id +
                ", tableNumber='" + tableNumber + '\'' +
                ", tableName='" + tableName + '\'' +
                ", capacity=" + capacity +
                ", status=" + status +
                ", isActive=" + isActive +
                '}';
    }
}
