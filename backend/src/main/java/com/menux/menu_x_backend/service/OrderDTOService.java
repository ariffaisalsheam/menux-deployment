package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.dto.order.OrderDTO;
import com.menux.menu_x_backend.entity.Order;
import com.menux.menu_x_backend.entity.OrderItem;
import com.menux.menu_x_backend.repository.OrderItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for safely creating OrderDTOs without triggering lazy loading
 */
@Service
public class OrderDTOService {

    @Autowired
    private OrderItemRepository orderItemRepository;

    /**
     * Safely create OrderDTO from Order entity without triggering lazy loading
     */
    public OrderDTO createOrderDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setCustomerName(order.getCustomerName());
        dto.setCustomerPhone(order.getCustomerPhone());
        dto.setTableNumber(order.getTableNumber());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setStatus(order.getStatus().name());
        dto.setPaymentStatus(order.getPaymentStatus().name());
        dto.setSpecialInstructions(order.getSpecialInstructions());
        dto.setNotes(order.getSpecialInstructions()); // Alias for frontend
        dto.setEstimatedPreparationTime(order.getEstimatedPreparationTime());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());
        dto.setCompletedAt(order.getCompletedAt());
        
        // Safely convert orderItems without triggering lazy loading
        List<OrderDTO.OrderItemDTO> items = order.getOrderItems().stream()
            .map(this::createOrderItemDTO)
            .collect(Collectors.toList());
        dto.setItems(items);
        
        return dto;
    }

    /**
     * Safely create OrderItemDTO from OrderItem entity without triggering lazy loading
     */
    private OrderDTO.OrderItemDTO createOrderItemDTO(OrderItem orderItem) {
        OrderDTO.OrderItemDTO dto = new OrderDTO.OrderItemDTO();
        dto.setId(orderItem.getId());
        dto.setQuantity(orderItem.getQuantity());
        dto.setPrice(orderItem.getPrice());
        dto.setSpecialInstructions(orderItem.getSpecialInstructions());
        
        // Safely get menu item name without triggering lazy loading
        String menuItemName = orderItemRepository.getMenuItemNameByOrderItemId(orderItem.getId());
        dto.setName(menuItemName);
        
        return dto;
    }
}
