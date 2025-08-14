package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.MenuItem;
import com.menux.menu_x_backend.entity.Feedback;
import com.menux.menu_x_backend.entity.Order;
import com.menux.menu_x_backend.entity.OrderItem;
import com.menux.menu_x_backend.entity.Table;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.repository.MenuItemRepository;
import com.menux.menu_x_backend.repository.FeedbackRepository;
import com.menux.menu_x_backend.repository.OrderRepository;
import com.menux.menu_x_backend.repository.TableRepository;
import com.menux.menu_x_backend.repository.OrderItemRepository;
import com.menux.menu_x_backend.service.MenuViewTrackingService;
import com.menux.menu_x_backend.util.InputSanitizer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.servlet.http.HttpServletRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/public/menu")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PublicMenuController {

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TableRepository tableRepository;

    @Autowired
    private InputSanitizer inputSanitizer;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private MenuViewTrackingService menuViewTrackingService;

    /**
     * Get restaurant information and menu for public viewing
     */
    @GetMapping("/{restaurantId}")
    public ResponseEntity<Map<String, Object>> getPublicMenu(@PathVariable Long restaurantId,
                                                            @RequestParam(required = true) String table,
                                                            HttpServletRequest request) {
        // Validate table parameter
        if (table == null || table.trim().isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Table number is required");
            errorResponse.put("message", "All menu links must include a table number for proper order tracking");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(restaurantId);

        if (restaurantOpt.isEmpty() || !restaurantOpt.get().getIsActive()) {
            return ResponseEntity.notFound().build();
        }

        Restaurant restaurant = restaurantOpt.get();
        List<MenuItem> menuItems = menuItemRepository.findByRestaurantIdAndIsAvailableTrueOrdered(restaurantId);

        // Track menu view with table number
        String sanitizedTable = table.trim();
        menuViewTrackingService.trackMenuScan(restaurantId, sanitizedTable, request);

        Map<String, Object> response = new HashMap<>();

        // Restaurant information
        Map<String, Object> restaurantInfo = new HashMap<>();
        restaurantInfo.put("id", restaurant.getId());
        restaurantInfo.put("name", restaurant.getName());
        restaurantInfo.put("description", restaurant.getDescription());
        restaurantInfo.put("address", restaurant.getAddress());
        restaurantInfo.put("phoneNumber", restaurant.getPhoneNumber());
        restaurantInfo.put("email", restaurant.getEmail());
        restaurantInfo.put("subscriptionPlan", restaurant.getSubscriptionPlan().toString());

        response.put("restaurant", restaurantInfo);
        response.put("menuItems", menuItems);
        response.put("isPro", restaurant.isPro());
        response.put("tableNumber", sanitizedTable);

        return ResponseEntity.ok(response);
    }

    /**
     * Submit feedback for a restaurant (available for all restaurants)
     */
    @PostMapping("/{restaurantId}/feedback")
    public ResponseEntity<Map<String, String>> submitFeedback(
            @PathVariable Long restaurantId,
            @Valid @RequestBody FeedbackRequest request) {
        
        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(restaurantId);
        
        if (restaurantOpt.isEmpty() || !restaurantOpt.get().getIsActive()) {
            return ResponseEntity.notFound().build();
        }

        Restaurant restaurant = restaurantOpt.get();

        // Validate and sanitize input
        if (request.getCustomerEmail() != null && !inputSanitizer.isValidEmail(request.getCustomerEmail())) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid email format");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        // Create feedback with sanitized input
        Feedback feedback = new Feedback();
        feedback.setRestaurant(restaurant);
        feedback.setCustomerName(inputSanitizer.sanitizeInput(request.getCustomerName()));
        feedback.setCustomerEmail(inputSanitizer.sanitizeInput(request.getCustomerEmail()));
        feedback.setRating(request.getRating());
        feedback.setComment(inputSanitizer.sanitizeFeedbackComment(request.getComment()));
        feedback.setOrderNumber(inputSanitizer.sanitizeOrderNumber(request.getOrderNumber()));
        feedback.setCreatedAt(LocalDateTime.now());

        feedbackRepository.save(feedback);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Thank you for your feedback!");
        response.put("status", "success");

        return ResponseEntity.ok(response);
    }

    /**
     * Get public feedback list for a restaurant
     */
    @GetMapping("/{restaurantId}/feedback")
    public ResponseEntity<List<Map<String, Object>>> getFeedbackList(@PathVariable Long restaurantId) {
        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(restaurantId);

        if (restaurantOpt.isEmpty() || !restaurantOpt.get().getIsActive()) {
            return ResponseEntity.notFound().build();
        }

        List<Feedback> items = feedbackRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId);
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (Feedback f : items) {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", f.getId());
            dto.put("customerName", f.getCustomerName());
            dto.put("rating", f.getRating());
            dto.put("comment", f.getComment());
            dto.put("createdAt", f.getCreatedAt());
            // Only expose AI fields for Pro restaurants
            if (restaurantOpt.get().isPro() && f.getAiAnalysis() != null) {
                dto.put("aiAnalysis", f.getAiAnalysis());
                dto.put("aiSentiment", f.getAiSentiment() != null ? f.getAiSentiment().toString() : null);
            }
            result.add(dto);
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Place order for Pro restaurants (with optional table assignment)
     */
    @PostMapping("/{restaurantId}/order")
    public ResponseEntity<Map<String, Object>> placeOrder(
            @PathVariable Long restaurantId,
            @Valid @RequestBody OrderRequest request) {

        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(restaurantId);

        if (restaurantOpt.isEmpty() || !restaurantOpt.get().getIsActive()) {
            return ResponseEntity.notFound().build();
        }

        Restaurant restaurant = restaurantOpt.get();

        // Check if restaurant supports ordering (Pro feature)
        if (!restaurant.isPro()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Ordering is only available for Pro restaurants");
            return ResponseEntity.status(403).body(errorResponse);
        }

        try {
            // Create order
            Order order = new Order();
            order.setRestaurant(restaurant);
            order.setOrderNumber(generateOrderNumber());
            order.setCustomerName(inputSanitizer.sanitizeInput(request.getCustomerName()));
            order.setCustomerPhone(inputSanitizer.sanitizeInput(request.getCustomerPhone()));
            order.setSpecialInstructions(inputSanitizer.sanitizeFeedbackComment(request.getSpecialInstructions()));
            order.setStatus(Order.OrderStatus.PENDING);
            order.setPaymentStatus(Order.PaymentStatus.PENDING);
            order.setCreatedAt(LocalDateTime.now());

            // Handle table assignment if provided
            if (request.getTableNumber() != null && !request.getTableNumber().trim().isEmpty()) {
                String tableNumber = inputSanitizer.sanitizeInput(request.getTableNumber());
                Optional<Table> tableOpt = tableRepository.findByRestaurantIdAndTableNumberAndIsActiveTrue(
                    restaurantId, tableNumber);

                if (tableOpt.isPresent()) {
                    order.setTable(tableOpt.get());
                    order.setTableNumber(tableNumber); // Keep string field for backward compatibility

                    // Update table status to occupied
                    Table table = tableOpt.get();
                    table.setStatus(Table.TableStatus.OCCUPIED);
                    table.setUpdatedAt(LocalDateTime.now());
                    tableRepository.save(table);
                } else {
                    // Table not found, but still allow order with table number as string
                    order.setTableNumber(tableNumber);
                }
            }

            // Calculate total amount (simplified - in real implementation, validate menu items and prices)
            BigDecimal totalAmount = request.getOrderItems().stream()
                .map(item -> BigDecimal.valueOf(item.getPrice()).multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            order.setTotalAmount(totalAmount);

            // Save order
            Order savedOrder = orderRepository.save(order);

            // Create order items (simplified - in real implementation, validate against menu)
            List<OrderItem> orderItems = new java.util.ArrayList<>();
            for (OrderItemRequest itemRequest : request.getOrderItems()) {
                // Find menu item by name (simplified lookup)
                Optional<MenuItem> menuItemOpt = menuItemRepository.findByNameAndRestaurantId(
                    itemRequest.getMenuItemName(), restaurantId);

                if (menuItemOpt.isPresent()) {
                    OrderItem orderItem = new OrderItem();
                    orderItem.setOrder(savedOrder);
                    orderItem.setMenuItem(menuItemOpt.get());
                    orderItem.setQuantity(itemRequest.getQuantity());
                    orderItem.setPrice(BigDecimal.valueOf(itemRequest.getPrice()));
                    orderItem.setSpecialInstructions(inputSanitizer.sanitizeFeedbackComment(itemRequest.getSpecialInstructions()));
                    orderItem.setCreatedAt(LocalDateTime.now());
                    orderItems.add(orderItem);
                }
            }

            // Persist order items so analytics can aggregate top-selling items
            savedOrder.setOrderItems(orderItems);
            if (!orderItems.isEmpty()) {
                orderItemRepository.saveAll(orderItems);
                // Save order again to ensure bidirectional relation is flushed
                orderRepository.save(savedOrder);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", savedOrder.getId());
            response.put("orderNumber", savedOrder.getOrderNumber());
            response.put("status", savedOrder.getStatus().toString());
            response.put("totalAmount", savedOrder.getTotalAmount());
            response.put("tableNumber", savedOrder.getTableNumber());
            response.put("message", "Order placed successfully!");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to place order: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Get restaurant basic info (for SEO and meta tags)
     */
    @GetMapping("/{restaurantId}/info")
    public ResponseEntity<Map<String, Object>> getRestaurantInfo(@PathVariable Long restaurantId) {
        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(restaurantId);
        
        if (restaurantOpt.isEmpty() || !restaurantOpt.get().getIsActive()) {
            return ResponseEntity.notFound().build();
        }

        Restaurant restaurant = restaurantOpt.get();

        Map<String, Object> response = new HashMap<>();
        response.put("id", restaurant.getId());
        response.put("name", restaurant.getName());
        response.put("description", restaurant.getDescription());
        response.put("address", restaurant.getAddress());
        response.put("phoneNumber", restaurant.getPhoneNumber());
        response.put("subscriptionPlan", restaurant.getSubscriptionPlan().toString());
        response.put("isPro", restaurant.isPro());

        return ResponseEntity.ok(response);
    }

    /**
     * Check if restaurant supports ordering (Pro feature)
     */
    @GetMapping("/{restaurantId}/features")
    public ResponseEntity<Map<String, Object>> getRestaurantFeatures(@PathVariable Long restaurantId) {
        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(restaurantId);
        
        if (restaurantOpt.isEmpty() || !restaurantOpt.get().getIsActive()) {
            return ResponseEntity.notFound().build();
        }

        Restaurant restaurant = restaurantOpt.get();
        boolean isPro = restaurant.isPro();

        Map<String, Object> features = new HashMap<>();
        features.put("canOrder", isPro);
        features.put("canTrackOrders", isPro);
        features.put("canRequestBill", isPro);
        features.put("hasAdvancedFeedback", isPro);
        features.put("subscriptionPlan", restaurant.getSubscriptionPlan().toString());

        return ResponseEntity.ok(features);
    }

    /**
     * Public order tracking by order number
     */
    @GetMapping("/{restaurantId}/order/{orderNumber}")
    public ResponseEntity<Map<String, Object>> getPublicOrderStatus(
            @PathVariable Long restaurantId,
            @PathVariable String orderNumber) {
        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(restaurantId);
        if (restaurantOpt.isEmpty() || !restaurantOpt.get().getIsActive()) {
            return ResponseEntity.notFound().build();
        }

        // Basic sanitize of order number
        String sanitized = inputSanitizer.sanitizeOrderNumber(orderNumber);

        Optional<Order> orderOpt = orderRepository.findByRestaurantIdAndOrderNumber(restaurantId, sanitized);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Order order = orderOpt.get();

        Map<String, Object> dto = new HashMap<>();
        dto.put("orderNumber", order.getOrderNumber());
        dto.put("status", order.getStatus().name());
        dto.put("paymentStatus", order.getPaymentStatus().name());
        dto.put("createdAt", order.getCreatedAt());
        dto.put("updatedAt", order.getUpdatedAt());
        dto.put("completedAt", order.getCompletedAt());
        dto.put("estimatedPreparationTime", order.getEstimatedPreparationTime());
        dto.put("tableNumber", order.getTableNumber());
        dto.put("totalAmount", order.getTotalAmount());

        // Public-safe timeline milestones
        Map<String, Object> timeline = new HashMap<>();
        timeline.put("placed", order.getCreatedAt());
        // We don't have explicit timestamps per status; expose current status only
        dto.put("timeline", timeline);

        return ResponseEntity.ok(dto);
    }

    /**
     * Public endpoint to request bill for an order (Pro restaurants only)
     */
    @PostMapping("/{restaurantId}/order/{orderNumber}/request-bill")
    public ResponseEntity<Map<String, Object>> requestBill(
            @PathVariable Long restaurantId,
            @PathVariable String orderNumber) {
        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(restaurantId);
        if (restaurantOpt.isEmpty() || !restaurantOpt.get().getIsActive()) {
            return ResponseEntity.notFound().build();
        }

        Restaurant restaurant = restaurantOpt.get();
        if (!restaurant.isPro()) {
            return ResponseEntity.status(403).build();
        }

        String sanitized = inputSanitizer.sanitizeOrderNumber(orderNumber);
        Optional<Order> orderOpt = orderRepository.findByRestaurantIdAndOrderNumber(restaurantId, sanitized);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Order order = orderOpt.get();

        // If already paid, no action
        if (order.getPaymentStatus() == Order.PaymentStatus.PAID) {
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Order already paid");
            resp.put("paymentStatus", order.getPaymentStatus().name());
            return ResponseEntity.ok(resp);
        }

        // If already requested, return idempotent response
        if (order.getPaymentStatus() == Order.PaymentStatus.BILL_REQUESTED) {
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Bill already requested");
            resp.put("paymentStatus", order.getPaymentStatus().name());
            return ResponseEntity.ok(resp);
        }

        order.setPaymentStatus(Order.PaymentStatus.BILL_REQUESTED);
        orderRepository.save(order);

        Map<String, Object> resp = new HashMap<>();
        resp.put("message", "Bill requested successfully");
        resp.put("paymentStatus", order.getPaymentStatus().name());
        return ResponseEntity.ok(resp);
    }

    /**
     * Public multi-order tracking by table number (Pro restaurants only)
     */
    @GetMapping("/{restaurantId}/orders/by-table")
    public ResponseEntity<List<Map<String, Object>>> getOrdersByTable(
            @PathVariable Long restaurantId,
            @RequestParam("table") String tableNumber) {
        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(restaurantId);
        if (restaurantOpt.isEmpty() || !restaurantOpt.get().getIsActive()) {
            return ResponseEntity.notFound().build();
        }

        Restaurant restaurant = restaurantOpt.get();
        if (!restaurant.isPro()) {
            return ResponseEntity.status(403).build();
        }

        String sanitizedTable = inputSanitizer.sanitizeInput(tableNumber);
        List<Order> orders = orderRepository.findByRestaurantIdAndTableNumberOrderByCreatedAtDesc(
                restaurantId, sanitizedTable);

        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (Order o : orders) {
            Map<String, Object> dto = new HashMap<>();
            dto.put("orderNumber", o.getOrderNumber());
            dto.put("status", o.getStatus().name());
            dto.put("paymentStatus", o.getPaymentStatus().name());
            dto.put("createdAt", o.getCreatedAt());
            dto.put("updatedAt", o.getUpdatedAt());
            dto.put("completedAt", o.getCompletedAt());
            dto.put("estimatedPreparationTime", o.getEstimatedPreparationTime());
            dto.put("tableNumber", o.getTableNumber());
            dto.put("totalAmount", o.getTotalAmount());
            result.add(dto);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Public multi-order tracking by customer phone (Pro restaurants only)
     */
    @GetMapping("/{restaurantId}/orders/by-customer")
    public ResponseEntity<List<Map<String, Object>>> getOrdersByCustomerPhone(
            @PathVariable Long restaurantId,
            @RequestParam("phone") String phone) {
        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(restaurantId);
        if (restaurantOpt.isEmpty() || !restaurantOpt.get().getIsActive()) {
            return ResponseEntity.notFound().build();
        }

        Restaurant restaurant = restaurantOpt.get();
        if (!restaurant.isPro()) {
            return ResponseEntity.status(403).build();
        }

        String sanitizedPhone = inputSanitizer.sanitizeInput(phone);
        List<Order> orders = orderRepository.findByRestaurantIdAndCustomerPhoneOrderByCreatedAtDesc(
                restaurantId, sanitizedPhone);

        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (Order o : orders) {
            Map<String, Object> dto = new HashMap<>();
            dto.put("orderNumber", o.getOrderNumber());
            dto.put("status", o.getStatus().name());
            dto.put("paymentStatus", o.getPaymentStatus().name());
            dto.put("createdAt", o.getCreatedAt());
            dto.put("updatedAt", o.getUpdatedAt());
            dto.put("completedAt", o.getCompletedAt());
            dto.put("estimatedPreparationTime", o.getEstimatedPreparationTime());
            dto.put("tableNumber", o.getTableNumber());
            dto.put("totalAmount", o.getTotalAmount());
            result.add(dto);
        }

        return ResponseEntity.ok(result);
    }

    // Helper class for feedback requests
    @Validated
    public static class FeedbackRequest {
        private String customerName;
        private String customerEmail;

        @NotNull(message = "Rating is required")
        @Min(value = 1, message = "Rating must be at least 1")
        @Max(value = 5, message = "Rating must be at most 5")
        private Integer rating;

        @NotBlank(message = "Comment is required")
        private String comment;

        private String orderNumber;

        // Getters and setters
        public String getCustomerName() { return customerName; }
        public void setCustomerName(String customerName) { this.customerName = customerName; }

        public String getCustomerEmail() { return customerEmail; }
        public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

        public Integer getRating() { return rating; }
        public void setRating(Integer rating) { this.rating = rating; }

        public String getComment() { return comment; }
        public void setComment(String comment) { this.comment = comment; }

        public String getOrderNumber() { return orderNumber; }
        public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    }

    // Helper class for order requests
    public static class OrderRequest {
        @NotBlank(message = "Customer name is required")
        private String customerName;

        private String customerPhone;
        private String tableNumber;
        private String specialInstructions;

        @NotNull(message = "Order items are required")
        private List<OrderItemRequest> orderItems;

        // Getters and setters
        public String getCustomerName() { return customerName; }
        public void setCustomerName(String customerName) { this.customerName = customerName; }

        public String getCustomerPhone() { return customerPhone; }
        public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

        public String getTableNumber() { return tableNumber; }
        public void setTableNumber(String tableNumber) { this.tableNumber = tableNumber; }

        public String getSpecialInstructions() { return specialInstructions; }
        public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }

        public List<OrderItemRequest> getOrderItems() { return orderItems; }
        public void setOrderItems(List<OrderItemRequest> orderItems) { this.orderItems = orderItems; }
    }

    // Helper class for order item requests
    public static class OrderItemRequest {
        @NotBlank(message = "Menu item name is required")
        private String menuItemName;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        private Integer quantity;

        @NotNull(message = "Price is required")
        @Min(value = 0, message = "Price must be positive")
        private Double price;

        private String specialInstructions;

        // Getters and setters
        public String getMenuItemName() { return menuItemName; }
        public void setMenuItemName(String menuItemName) { this.menuItemName = menuItemName; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }

        public Double getPrice() { return price; }
        public void setPrice(Double price) { this.price = price; }

        public String getSpecialInstructions() { return specialInstructions; }
        public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }
    }

    // Helper method to generate order numbers
    private String generateOrderNumber() {
        return "ORD-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
