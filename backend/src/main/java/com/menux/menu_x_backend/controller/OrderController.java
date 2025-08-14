package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.dto.order.OrderDTO;
import com.menux.menu_x_backend.dto.order.PublicOrderRequest;
import com.menux.menu_x_backend.entity.MenuItem;
import com.menux.menu_x_backend.entity.Order;
import com.menux.menu_x_backend.entity.OrderItem;
import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.Table;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.repository.OrderRepository;
import com.menux.menu_x_backend.repository.MenuItemRepository;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.repository.TableRepository;
import com.menux.menu_x_backend.repository.UserRepository;
import com.menux.menu_x_backend.service.RestaurantService;
import com.menux.menu_x_backend.service.OrderDTOService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantService restaurantService;

    @Autowired
    private OrderDTOService orderDTOService;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private TableRepository tableRepository;

    // Restaurant owner endpoints (also accessible by admin for impersonation)
    @GetMapping("/manage")
    @PreAuthorize("hasRole('RESTAURANT_OWNER') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<OrderDTO>> getMyOrders(@RequestParam(required = false) Long restaurantId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();

        // Handle admin impersonation
        if (user.getRole() == User.Role.SUPER_ADMIN && restaurantId != null) {
            Optional<Restaurant> restaurantOpt = restaurantRepository.findById(restaurantId);
            if (restaurantOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            List<Order> orders = orderRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId);
            List<OrderDTO> orderDTOs = orders.stream()
                .map(orderDTOService::createOrderDTO)
                .collect(Collectors.toList());
            return ResponseEntity.ok(orderDTOs);
        }

        // Normal restaurant owner flow using context
        Optional<Long> restaurantIdOpt = restaurantService.getCurrentUserRestaurantId();
        if (restaurantIdOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<Order> orders = orderRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantIdOpt.get());
        List<OrderDTO> orderDTOs = orders.stream()
            .map(orderDTOService::createOrderDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(orderDTOs);
    }

    @GetMapping("/manage/{id}")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<OrderDTO> getOrderById(@PathVariable Long id) {
        Optional<Order> orderOpt = orderRepository.findById(id);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Order order = orderOpt.get();

        // Verify ownership using safe restaurant service
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        Long restaurantId = orderRepository.getRestaurantIdByOrderId(order.getId());
        if (userOpt.isEmpty() || restaurantId == null || !restaurantService.userOwnsRestaurant(userOpt.get().getId(), restaurantId)) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(orderDTOService.createOrderDTO(order));
    }

    @PutMapping("/manage/{id}/status")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<OrderDTO> updateOrderStatus(@PathVariable Long id, @RequestBody StatusUpdateRequest request) {
        Optional<Order> orderOpt = orderRepository.findById(id);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Order order = orderOpt.get();

        // Verify ownership using safe restaurant service
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        Long restaurantId = orderRepository.getRestaurantIdByOrderId(order.getId());
        if (userOpt.isEmpty() || restaurantId == null || !restaurantService.userOwnsRestaurant(userOpt.get().getId(), restaurantId)) {
            return ResponseEntity.status(403).build();
        }

        order.setStatus(Order.OrderStatus.valueOf(request.getStatus()));
        Order savedOrder = orderRepository.save(order);
        return ResponseEntity.ok(orderDTOService.createOrderDTO(savedOrder));
    }

    @PutMapping("/manage/{id}/payment-status")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<OrderDTO> updatePaymentStatus(@PathVariable Long id, @RequestBody PaymentStatusUpdateRequest request) {
        Optional<Order> orderOpt = orderRepository.findById(id);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Order order = orderOpt.get();

        // Verify ownership using safe restaurant service
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        Long restaurantId = orderRepository.getRestaurantIdByOrderId(order.getId());
        if (userOpt.isEmpty() || restaurantId == null || !restaurantService.userOwnsRestaurant(userOpt.get().getId(), restaurantId)) {
            return ResponseEntity.status(403).build();
        }

        // Update payment status
        Order.PaymentStatus newPaymentStatus = Order.PaymentStatus.valueOf(request.getPaymentStatus());
        order.setPaymentStatus(newPaymentStatus);
        Order saved = orderRepository.save(order);

        // If paid and order has a table, consider freeing the table if no open orders remain
        if (newPaymentStatus == Order.PaymentStatus.PAID) {
            String tableNumber = saved.getTableNumber();
            if (tableNumber != null && !tableNumber.trim().isEmpty()) {
                long openOrders = orderRepository.countOpenOrdersForTable(restaurantId, tableNumber.trim());
                if (openOrders == 0) {
                    tableRepository.findByRestaurantIdAndTableNumberAndIsActiveTrue(restaurantId, tableNumber.trim()).ifPresent(t -> {
                        t.setStatus(Table.TableStatus.AVAILABLE);
                        t.setUpdatedAt(java.time.LocalDateTime.now());
                        tableRepository.save(t);
                    });
                }
            }
        }

        return ResponseEntity.ok(orderDTOService.createOrderDTO(saved));
    }

    // Endpoint for getting orders by restaurant (for admin/analytics and restaurant owners)
    @GetMapping("/restaurant/{restaurantId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<List<OrderDTO>> getOrdersByRestaurant(@PathVariable Long restaurantId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();

        // If user is restaurant owner, verify they own this restaurant via context
        if (user.getRole() == User.Role.RESTAURANT_OWNER) {
            Optional<Long> userRestaurantIdOpt = restaurantService.getCurrentUserRestaurantId();
            if (userRestaurantIdOpt.isEmpty() || !userRestaurantIdOpt.get().equals(restaurantId)) {
                return ResponseEntity.status(403).build(); // Forbidden - not their restaurant
            }
        }

        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(restaurantId);
        if (restaurantOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<Order> orders = orderRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId);
        List<OrderDTO> orderDTOs = orders.stream()
            .map(orderDTOService::createOrderDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(orderDTOs);
    }

    // Public endpoint for placing orders (for QR code access)
    @PostMapping("/restaurant/{restaurantId}")
    public ResponseEntity<OrderDTO> placeOrder(@PathVariable Long restaurantId,
                                               @Valid @RequestBody PublicOrderRequest request) {
        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(restaurantId);
        if (restaurantOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Restaurant restaurant = restaurantOpt.get();

        // Validate items exist and build order
        if (request.getOrderItems() == null || request.getOrderItems().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Order order = new Order();
        order.setRestaurant(restaurant);
        order.setCustomerName(request.getCustomerName());
        order.setCustomerPhone(request.getCustomerPhone());
        order.setTableNumber(request.getTableNumber());
        order.setSpecialInstructions(request.getSpecialInstructions());

        // Attach table entity if exists for this restaurant
        if (request.getTableNumber() != null && !request.getTableNumber().trim().isEmpty()) {
            tableRepository.findByRestaurantIdAndTableNumberAndIsActiveTrue(restaurantId, request.getTableNumber().trim())
                .ifPresent(order::setTable);
        }

        for (PublicOrderRequest.Item reqItem : request.getOrderItems()) {
            Optional<MenuItem> menuItemOpt = menuItemRepository.findByNameAndRestaurantId(reqItem.getMenuItemName(), restaurantId);
            if (menuItemOpt.isEmpty()) {
                // Invalid menu item for this restaurant or not available
                return ResponseEntity.badRequest().build();
            }

            MenuItem menuItem = menuItemOpt.get();

            OrderItem orderItem = new OrderItem();
            orderItem.setMenuItem(menuItem);
            orderItem.setQuantity(reqItem.getQuantity());
            // Use current menu item price to prevent client tampering
            orderItem.setPrice(menuItem.getPrice());
            orderItem.setSpecialInstructions(reqItem.getSpecialInstructions());

            order.addOrderItem(orderItem);
        }

        // Calculate total server-side and set
        order.setTotalAmount(order.calculateTotalAmount());

        Order savedOrder = orderRepository.save(order);
        return ResponseEntity.ok(orderDTOService.createOrderDTO(savedOrder));
    }

    // Helper class for status update requests
    public static class StatusUpdateRequest {
        private String status;

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }

    public static class PaymentStatusUpdateRequest {
        private String paymentStatus;

        public String getPaymentStatus() {
            return paymentStatus;
        }

        public void setPaymentStatus(String paymentStatus) {
            this.paymentStatus = paymentStatus;
        }
    }
}
