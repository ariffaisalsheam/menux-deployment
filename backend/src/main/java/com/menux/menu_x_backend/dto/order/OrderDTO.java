package com.menux.menu_x_backend.dto.order;

import com.menux.menu_x_backend.entity.Order;
import com.menux.menu_x_backend.entity.OrderItem;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class OrderDTO {
    
    private Long id;
    private String orderNumber;
    private String customerName;
    private String customerPhone;
    private String tableNumber;
    private BigDecimal totalAmount;
    private String status;
    private String paymentStatus;
    private String specialInstructions;
    private Integer estimatedPreparationTime;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;
    private List<OrderItemDTO> items;
    private String notes; // Alias for specialInstructions for frontend compatibility
    
    // Constructors
    public OrderDTO() {}
    
    public OrderDTO(Order order) {
        this.id = order.getId();
        this.orderNumber = order.getOrderNumber();
        this.customerName = order.getCustomerName();
        this.customerPhone = order.getCustomerPhone();
        this.tableNumber = order.getTableNumber();
        this.totalAmount = order.getTotalAmount();
        this.status = order.getStatus().name();
        this.paymentStatus = order.getPaymentStatus().name();
        this.specialInstructions = order.getSpecialInstructions();
        this.notes = order.getSpecialInstructions(); // Alias for frontend
        this.estimatedPreparationTime = order.getEstimatedPreparationTime();
        this.createdAt = order.getCreatedAt();
        this.updatedAt = order.getUpdatedAt();
        this.completedAt = order.getCompletedAt();

        // WARNING: This constructor is unsafe as it triggers lazy loading!
        // Use OrderDTOService.createOrderDTO() instead for safe DTO creation
        // Keeping this for backward compatibility but it should be avoided
        this.items = order.getOrderItems().stream()
            .map(OrderItemDTO::new)
            .collect(Collectors.toList());
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    
    public String getTableNumber() { return tableNumber; }
    public void setTableNumber(String tableNumber) { this.tableNumber = tableNumber; }
    
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    
    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { 
        this.specialInstructions = specialInstructions;
        this.notes = specialInstructions; // Keep alias in sync
    }
    
    public String getNotes() { return notes; }
    public void setNotes(String notes) { 
        this.notes = notes;
        this.specialInstructions = notes; // Keep alias in sync
    }
    
    public Integer getEstimatedPreparationTime() { return estimatedPreparationTime; }
    public void setEstimatedPreparationTime(Integer estimatedPreparationTime) { 
        this.estimatedPreparationTime = estimatedPreparationTime; 
    }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    
    public List<OrderItemDTO> getItems() { return items; }
    public void setItems(List<OrderItemDTO> items) { this.items = items; }
    
    // Inner class for simplified order item structure
    public static class OrderItemDTO {
        private Long id;
        private String name;
        private Integer quantity;
        private BigDecimal price;
        private String specialInstructions;
        
        public OrderItemDTO() {}
        
        public OrderItemDTO(OrderItem orderItem) {
            this.id = orderItem.getId();
            this.name = orderItem.getMenuItem().getName();
            this.quantity = orderItem.getQuantity();
            this.price = orderItem.getPrice();
            this.specialInstructions = orderItem.getSpecialInstructions();
        }
        
        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
        
        public String getSpecialInstructions() { return specialInstructions; }
        public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }
    }
}
