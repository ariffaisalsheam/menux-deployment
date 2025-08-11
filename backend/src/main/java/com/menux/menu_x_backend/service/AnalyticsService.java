package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.dto.analytics.RestaurantAnalyticsDTO;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.Order;
import com.menux.menu_x_backend.repository.UserRepository;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class AnalyticsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private OrderRepository orderRepository;

    public RestaurantAnalyticsDTO getRestaurantAnalytics() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        
        User user = userOpt.get();
        Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerId(user.getId());
        
        if (restaurantOpt.isEmpty()) {
            throw new RuntimeException("Restaurant not found for user");
        }
        
        return generateAnalytics(restaurantOpt.get());
    }

    public RestaurantAnalyticsDTO getRestaurantAnalyticsById(Long restaurantId) {
        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(restaurantId);
        if (restaurantOpt.isEmpty()) {
            throw new RuntimeException("Restaurant not found with id: " + restaurantId);
        }
        
        return generateAnalytics(restaurantOpt.get());
    }

    private RestaurantAnalyticsDTO generateAnalytics(Restaurant restaurant) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastMonth = now.minusMonths(1);
        LocalDateTime twoMonthsAgo = now.minusMonths(2);

        // Get current month data
        List<Order> currentMonthOrders = orderRepository.findByRestaurantIdAndCreatedAtBetween(
            restaurant.getId(), lastMonth, now);
        
        // Get previous month data
        List<Order> previousMonthOrders = orderRepository.findByRestaurantIdAndCreatedAtBetween(
            restaurant.getId(), twoMonthsAgo, lastMonth);

        // Calculate metrics
        double currentRevenue = currentMonthOrders.stream()
            .filter(order -> order.getStatus() == Order.OrderStatus.SERVED)
            .mapToDouble(order -> order.getTotalAmount() != null ? order.getTotalAmount().doubleValue() : 0.0)
            .sum();

        double previousRevenue = previousMonthOrders.stream()
            .filter(order -> order.getStatus() == Order.OrderStatus.SERVED)
            .mapToDouble(order -> order.getTotalAmount() != null ? order.getTotalAmount().doubleValue() : 0.0)
            .sum();

        long currentOrders = currentMonthOrders.size();
        long previousOrders = previousMonthOrders.size();

        // Calculate changes
        double revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
        double ordersChange = previousOrders > 0 ? ((double)(currentOrders - previousOrders) / previousOrders) * 100 : 0;

        // Create metric data
        RestaurantAnalyticsDTO.MetricData revenue = new RestaurantAnalyticsDTO.MetricData(
            currentRevenue, previousRevenue, revenueChange);
        
        RestaurantAnalyticsDTO.MetricData orders = new RestaurantAnalyticsDTO.MetricData(
            (double)currentOrders, (double)previousOrders, ordersChange);

        // Mock data for customers and rating (would be calculated from real data)
        RestaurantAnalyticsDTO.MetricData customers = new RestaurantAnalyticsDTO.MetricData(
            573.0, 498.0, 15.1);
        
        RestaurantAnalyticsDTO.MetricData rating = new RestaurantAnalyticsDTO.MetricData(
            4.8, 4.6, 4.3);

        // Mock top selling items
        List<RestaurantAnalyticsDTO.TopSellingItem> topSellingItems = new ArrayList<>();
        topSellingItems.add(new RestaurantAnalyticsDTO.TopSellingItem("Chicken Biryani", 156L, 54600.0));
        topSellingItems.add(new RestaurantAnalyticsDTO.TopSellingItem("Beef Curry", 89L, 31150.0));
        topSellingItems.add(new RestaurantAnalyticsDTO.TopSellingItem("Fish Fry", 67L, 20100.0));

        // Mock weekly trends
        List<RestaurantAnalyticsDTO.WeeklyTrend> weeklyTrends = new ArrayList<>();
        weeklyTrends.add(new RestaurantAnalyticsDTO.WeeklyTrend("This Week", 12500.0, 89L, 15.2));
        weeklyTrends.add(new RestaurantAnalyticsDTO.WeeklyTrend("Last Week", 10850.0, 77L, 8.5));
        weeklyTrends.add(new RestaurantAnalyticsDTO.WeeklyTrend("2 Weeks Ago", 9980.0, 71L, -2.1));

        // Count live orders (orders that are not served or cancelled)
        long liveOrders = orderRepository.countByRestaurantIdAndStatusIn(
            restaurant.getId(), 
            List.of(Order.OrderStatus.PENDING, Order.OrderStatus.CONFIRMED, Order.OrderStatus.PREPARING)
        );

        return new RestaurantAnalyticsDTO(revenue, orders, customers, rating, 
                                        topSellingItems, weeklyTrends, liveOrders);
    }
}
