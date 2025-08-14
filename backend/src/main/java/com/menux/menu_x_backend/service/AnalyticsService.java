package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.dto.analytics.BasicAnalyticsDTO;
import com.menux.menu_x_backend.dto.analytics.RestaurantAnalyticsDTO;
import com.menux.menu_x_backend.dto.analytics.RecentActivityDTO;
import com.menux.menu_x_backend.dto.analytics.FeedbackAnalyticsDTO;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.Order;
import com.menux.menu_x_backend.entity.Feedback;
import com.menux.menu_x_backend.entity.MenuItem;
import com.menux.menu_x_backend.entity.MenuView;
import com.menux.menu_x_backend.repository.UserRepository;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.repository.OrderRepository;
import com.menux.menu_x_backend.repository.FeedbackRepository;
import com.menux.menu_x_backend.repository.OrderItemRepository;
import com.menux.menu_x_backend.repository.MenuItemRepository;
import com.menux.menu_x_backend.repository.MenuViewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private RestaurantService restaurantService;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private MenuViewRepository menuViewRepository;

    public RestaurantAnalyticsDTO getRestaurantAnalytics() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        
        // Prefer context-based restaurant id to avoid extra DB lookups
        Optional<Long> restaurantIdOpt = restaurantService.getCurrentUserRestaurantId();
        if (restaurantIdOpt.isEmpty()) {
            throw new RuntimeException("Restaurant not found for user");
        }
        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(restaurantIdOpt.get());
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

        long currentOrders = currentMonthOrders.stream()
            .filter(o -> o.getStatus() == Order.OrderStatus.SERVED)
            .count();
        long previousOrders = previousMonthOrders.stream()
            .filter(o -> o.getStatus() == Order.OrderStatus.SERVED)
            .count();

        // Calculate changes
        double revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
        double ordersChange = previousOrders > 0 ? ((double)(currentOrders - previousOrders) / previousOrders) * 100 : 0;

        // Create metric data
        RestaurantAnalyticsDTO.MetricData revenue = new RestaurantAnalyticsDTO.MetricData(
            currentRevenue, previousRevenue, revenueChange);
        
        RestaurantAnalyticsDTO.MetricData orders = new RestaurantAnalyticsDTO.MetricData(
            (double)currentOrders, (double)previousOrders, ordersChange);

        // Customers metric: distinct customerPhone from SERVED orders
        long currentCustomersDistinct = orderRepository.countDistinctCustomersByPhoneInRange(
            restaurant.getId(), lastMonth, now);
        long previousCustomersDistinct = orderRepository.countDistinctCustomersByPhoneInRange(
            restaurant.getId(), twoMonthsAgo, lastMonth);
        double customersChange = previousCustomersDistinct > 0
            ? ((double)(currentCustomersDistinct - previousCustomersDistinct) / previousCustomersDistinct) * 100
            : 0.0;
        RestaurantAnalyticsDTO.MetricData customers = new RestaurantAnalyticsDTO.MetricData(
            (double) currentCustomersDistinct,
            (double) previousCustomersDistinct,
            customersChange);

        // Compute rating metric from real feedback
        Double currentAvgRating = feedbackRepository.getAverageRatingByRestaurantBetween(
            restaurant.getId(), lastMonth, now);
        Double previousAvgRating = feedbackRepository.getAverageRatingByRestaurantBetween(
            restaurant.getId(), twoMonthsAgo, lastMonth);
        double curr = currentAvgRating != null ? currentAvgRating : 0.0;
        double prev = previousAvgRating != null ? previousAvgRating : 0.0;
        double ratingChange = prev > 0 ? ((curr - prev) / prev) * 100 : 0.0;
        RestaurantAnalyticsDTO.MetricData rating = new RestaurantAnalyticsDTO.MetricData(
            curr, prev, ratingChange);

        // Top selling items (real data from served orders within last month)
        List<RestaurantAnalyticsDTO.TopSellingItem> topSellingItems = new ArrayList<>();
        List<Object[]> rows = orderItemRepository.getTopItemsByRestaurantAndDateRange(
            restaurant.getId(), lastMonth, now);
        for (Object[] row : rows) {
            String name = (String) row[0];
            long qty = ((Number) row[1]).longValue();
            double itemRevenue = ((Number) row[2]).doubleValue();
            topSellingItems.add(new RestaurantAnalyticsDTO.TopSellingItem(name, qty, itemRevenue));
        }

        // Weekly trends (real data: last 3 weeks including current)
        List<RestaurantAnalyticsDTO.WeeklyTrend> weeklyTrends = new ArrayList<>();
        // Define week ranges (Monday start)
        LocalDate today = LocalDate.now();
        LocalDate startOfThisWeekDate = today.with(DayOfWeek.MONDAY);
        LocalDateTime startOfThisWeek = startOfThisWeekDate.atStartOfDay();
        LocalDateTime startOfLastWeek = startOfThisWeek.minusWeeks(1);
        LocalDateTime startOfTwoWeeksAgo = startOfThisWeek.minusWeeks(2);
        LocalDateTime endOfThisWeek = startOfThisWeek.plusWeeks(1);
        
        class WeekAgg { double revenue; long orders; }

        java.util.function.BiFunction<LocalDateTime, LocalDateTime, WeekAgg> agg = (start, end) -> {
            List<Order> ordersInRange = orderRepository.findByRestaurantIdAndCreatedAtBetween(
                restaurant.getId(), start, end);
            WeekAgg wa = new WeekAgg();
            wa.orders = ordersInRange.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.SERVED)
                .count();
            wa.revenue = ordersInRange.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.SERVED)
                .map(Order::getTotalAmount)
                .filter(java.util.Objects::nonNull)
                .mapToDouble(BigDecimal::doubleValue)
                .sum();
            return wa;
        };

        WeekAgg thisW = agg.apply(startOfThisWeek, endOfThisWeek);
        WeekAgg lastW = agg.apply(startOfLastWeek, startOfThisWeek);
        WeekAgg twoW = agg.apply(startOfTwoWeeksAgo, startOfLastWeek);

        double changeThis = lastW.revenue > 0 ? ((thisW.revenue - lastW.revenue) / lastW.revenue) * 100 : 0.0;
        double changeLast = twoW.revenue > 0 ? ((lastW.revenue - twoW.revenue) / twoW.revenue) * 100 : 0.0;

        weeklyTrends.add(new RestaurantAnalyticsDTO.WeeklyTrend("This Week", thisW.revenue, thisW.orders, changeThis));
        weeklyTrends.add(new RestaurantAnalyticsDTO.WeeklyTrend("Last Week", lastW.revenue, lastW.orders, changeLast));
        weeklyTrends.add(new RestaurantAnalyticsDTO.WeeklyTrend("2 Weeks Ago", twoW.revenue, twoW.orders, 0.0));

        // Count live orders (orders that are not served or cancelled)
        long liveOrders = orderRepository.countByRestaurantIdAndStatusIn(
            restaurant.getId(), 
            List.of(Order.OrderStatus.PENDING, Order.OrderStatus.CONFIRMED, Order.OrderStatus.PREPARING)
        );

        RestaurantAnalyticsDTO dto = new RestaurantAnalyticsDTO(revenue, orders, customers, rating,
                topSellingItems, weeklyTrends, liveOrders);

        // Daily revenue trend for past 7 days (including today)
        List<RestaurantAnalyticsDTO.DailyRevenuePoint> daily = new ArrayList<>();
        LocalDate startDay = LocalDate.now().minusDays(6);
        LocalDateTime windowStart = startDay.atStartOfDay();
        LocalDateTime windowEnd = windowStart.plusDays(7);
        List<Order> last7 = orderRepository.findByRestaurantIdAndCreatedAtBetween(
                restaurant.getId(), windowStart, windowEnd);
        java.util.Map<LocalDate, Double> byDay = last7.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.SERVED)
                .filter(o -> o.getTotalAmount() != null)
                .collect(java.util.stream.Collectors.groupingBy(
                        o -> o.getCreatedAt().toLocalDate(),
                        java.util.stream.Collectors.summingDouble(o -> o.getTotalAmount().doubleValue())
                ));
        for (int i = 0; i < 7; i++) {
            LocalDate d = startDay.plusDays(i);
            double rev = byDay.getOrDefault(d, 0.0);
            daily.add(new RestaurantAnalyticsDTO.DailyRevenuePoint(d.toString(), rev));
        }
        dto.setDailyRevenueTrend(daily);

        return dto;
    }

    public FeedbackAnalyticsDTO getFeedbackAnalytics() {
        Optional<Long> restaurantIdOpt = restaurantService.getCurrentUserRestaurantId();
        if (restaurantIdOpt.isEmpty()) {
            throw new RuntimeException("Restaurant not found for user");
        }
        return buildFeedbackAnalytics(restaurantIdOpt.get());
    }

    public FeedbackAnalyticsDTO getFeedbackAnalyticsById(Long restaurantId) {
        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(restaurantId);
        if (restaurantOpt.isEmpty()) {
            throw new RuntimeException("Restaurant not found with id: " + restaurantId);
        }
        return buildFeedbackAnalytics(restaurantId);
    }

    private FeedbackAnalyticsDTO buildFeedbackAnalytics(Long restaurantId) {
        Double avg = feedbackRepository.getAverageRatingByRestaurant(restaurantId);
        Long total = feedbackRepository.countByRestaurantId(restaurantId);

        // Rating distribution 1..5
        Map<Integer, Long> dist = new HashMap<>();
        for (int i = 1; i <= 5; i++) dist.put(i, 0L);
        List<Object[]> rows = feedbackRepository.getFeedbackStatsByRestaurant(restaurantId);
        for (Object[] row : rows) {
            Integer rating = (Integer) row[0];
            Long count = (Long) row[1];
            dist.put(rating, count);
        }

        long positive = dist.entrySet().stream()
            .filter(e -> e.getKey() >= 4)
            .mapToLong(Map.Entry::getValue)
            .sum();
        long neutral = dist.getOrDefault(3, 0L);
        long negative = dist.entrySet().stream()
            .filter(e -> e.getKey() <= 2)
            .mapToLong(Map.Entry::getValue)
            .sum();

        // Recent feedback (limit 10)
        List<Feedback> recent = feedbackRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId);
        List<FeedbackAnalyticsDTO.RecentFeedback> recentDtos = recent.stream()
            .limit(10)
            .map(f -> new FeedbackAnalyticsDTO.RecentFeedback(
                f.getId(),
                f.getRating(),
                f.getComment(),
                f.getCustomerName(),
                f.getCreatedAt()
            ))
            .collect(Collectors.toList());

        return new FeedbackAnalyticsDTO(
            avg != null ? avg : 0.0,
            total != null ? total : 0L,
            positive,
            neutral,
            negative,
            dist,
            recentDtos
        );
    }

    // Recent Activity aggregation (orders, menu updates, feedback)
    public List<RecentActivityDTO> getRecentActivity() {
        Optional<Long> restaurantIdOpt = restaurantService.getCurrentUserRestaurantId();
        if (restaurantIdOpt.isEmpty()) {
            throw new RuntimeException("Restaurant not found for user");
        }
        return buildRecentActivity(restaurantIdOpt.get());
    }

    public List<RecentActivityDTO> getRecentActivityById(Long restaurantId) {
        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(restaurantId);
        if (restaurantOpt.isEmpty()) {
            throw new RuntimeException("Restaurant not found with id: " + restaurantId);
        }
        return buildRecentActivity(restaurantId);
    }

    private List<RecentActivityDTO> buildRecentActivity(Long restaurantId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime since = now.minusDays(7);

        List<RecentActivityDTO> items = new ArrayList<>();

        // Recent orders
        orderRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId).stream()
            .limit(10)
            .forEach(o -> {
                String title = "Order " + (o.getOrderNumber() != null ? ("#" + o.getOrderNumber()) : ("#" + o.getId()));
                String desc = (o.getStatus() != null ? o.getStatus().name() : "PENDING")
                        + (o.getTotalAmount() != null ? (" • ৳" + o.getTotalAmount().setScale(0, java.math.RoundingMode.HALF_UP)) : "");
                items.add(new RecentActivityDTO("ORDER", title, desc, o.getCreatedAt()));
            });

        // Recent menu updates
        menuItemRepository.findRecentUpdatedByRestaurant(restaurantId).stream()
            .limit(10)
            .forEach(mi -> {
                String title = "Menu updated: " + mi.getName();
                String desc = (mi.getIsAvailable() != null && mi.getIsAvailable()) ? "Available" : "Unavailable";
                items.add(new RecentActivityDTO("MENU", title, desc, mi.getUpdatedAt() != null ? mi.getUpdatedAt() : mi.getCreatedAt()));
            });

        // Recent feedback
        feedbackRepository.findRecentFeedbackByRestaurant(restaurantId, since).stream()
            .limit(10)
            .forEach(f -> {
                String customer = (f.getCustomerName() != null && !f.getCustomerName().isBlank()) ? f.getCustomerName() : "Customer";
                String title = customer + " rated " + f.getRating() + "/5";
                String desc = f.getComment() != null ? f.getComment() : "";
                items.add(new RecentActivityDTO("FEEDBACK", title, desc, f.getCreatedAt()));
            });

        // Sort by createdAt desc and limit
        return items.stream()
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .limit(15)
            .collect(Collectors.toList());
    }

    // Basic Analytics for non-Pro users
    public BasicAnalyticsDTO getBasicAnalytics() {
        Optional<Long> restaurantIdOpt = restaurantService.getCurrentUserRestaurantId();
        if (restaurantIdOpt.isEmpty()) {
            throw new RuntimeException("Restaurant not found for user");
        }
        return buildBasicAnalytics(restaurantIdOpt.get());
    }

    public BasicAnalyticsDTO getBasicAnalyticsById(Long restaurantId) {
        return buildBasicAnalytics(restaurantId);
    }

    private BasicAnalyticsDTO buildBasicAnalytics(Long restaurantId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastMonth = now.minusMonths(1);
        LocalDateTime twoMonthsAgo = now.minusMonths(2);
        LocalDateTime lastWeek = now.minusWeeks(1);

        // Total Views Metric
        long currentViews = menuViewRepository.countByRestaurantIdAndCreatedAtBetween(restaurantId, lastMonth, now);
        long previousViews = menuViewRepository.countByRestaurantIdAndCreatedAtBetween(restaurantId, twoMonthsAgo, lastMonth);
        double viewsChange = previousViews > 0 ? ((double)(currentViews - previousViews) / previousViews) * 100 : 0;
        BasicAnalyticsDTO.MetricData totalViews = new BasicAnalyticsDTO.MetricData(currentViews, previousViews, viewsChange);

        // QR Scans Metric
        long currentScans = menuViewRepository.countByRestaurantIdAndViewTypeAndCreatedAtBetween(
            restaurantId, MenuView.ViewType.MENU_SCAN, lastMonth, now);
        long previousScans = menuViewRepository.countByRestaurantIdAndViewTypeAndCreatedAtBetween(
            restaurantId, MenuView.ViewType.MENU_SCAN, twoMonthsAgo, lastMonth);
        double scansChange = previousScans > 0 ? ((double)(currentScans - previousScans) / previousScans) * 100 : 0;
        BasicAnalyticsDTO.MetricData qrScans = new BasicAnalyticsDTO.MetricData(currentScans, previousScans, scansChange);

        // Unique Visitors Metric
        long currentVisitors = menuViewRepository.countUniqueVisitorsInRange(restaurantId, lastMonth, now);
        long previousVisitors = menuViewRepository.countUniqueVisitorsInRange(restaurantId, twoMonthsAgo, lastMonth);
        double visitorsChange = previousVisitors > 0 ? ((double)(currentVisitors - previousVisitors) / previousVisitors) * 100 : 0;
        BasicAnalyticsDTO.MetricData uniqueVisitors = new BasicAnalyticsDTO.MetricData(currentVisitors, previousVisitors, visitorsChange);

        // Menu Items Metric
        long currentMenuItems = menuItemRepository.countByRestaurantId(restaurantId);
        long previousMenuItems = currentMenuItems; // For now, assume no change tracking
        BasicAnalyticsDTO.MetricData menuItems = new BasicAnalyticsDTO.MetricData(currentMenuItems, previousMenuItems, 0);

        // Most Viewed Items
        List<Object[]> viewData = menuViewRepository.findMostViewedMenuItemsInRange(restaurantId, lastMonth, now);
        List<BasicAnalyticsDTO.PopularItem> mostViewedItems = new ArrayList<>();
        for (Object[] row : viewData) {
            Long menuItemId = (Long) row[0];
            Long viewCount = (Long) row[1];

            Optional<MenuItem> menuItemOpt = menuItemRepository.findById(menuItemId);
            if (menuItemOpt.isPresent()) {
                MenuItem item = menuItemOpt.get();
                mostViewedItems.add(new BasicAnalyticsDTO.PopularItem(
                    menuItemId, item.getName(), item.getCategory().toString(), viewCount, item.getPrice().doubleValue()));
            }
        }

        // Daily Views for past 7 days
        List<Object[]> dailyData = menuViewRepository.findDailyViewCounts(restaurantId, lastWeek);
        List<BasicAnalyticsDTO.DailyViewPoint> dailyViews = new ArrayList<>();
        for (Object[] row : dailyData) {
            String date = row[0].toString();
            Long views = (Long) row[1];
            // Get scans for the same day
            long scans = menuViewRepository.countByRestaurantIdAndViewTypeAndCreatedAtBetween(
                restaurantId, MenuView.ViewType.MENU_SCAN,
                LocalDate.parse(date).atStartOfDay(),
                LocalDate.parse(date).atStartOfDay().plusDays(1));
            dailyViews.add(new BasicAnalyticsDTO.DailyViewPoint(date, views, scans));
        }

        // Recent Menu Updates
        List<MenuItem> recentUpdates = menuItemRepository.findRecentUpdatedByRestaurant(restaurantId);
        List<BasicAnalyticsDTO.MenuUpdateActivity> updateActivities = recentUpdates.stream()
            .limit(10)
            .map(item -> new BasicAnalyticsDTO.MenuUpdateActivity(
                item.getName(),
                "UPDATED",
                item.getUpdatedAt() != null ? item.getUpdatedAt() : item.getCreatedAt(),
                item.getCategory().toString()))
            .collect(Collectors.toList());

        // View Distribution (hourly)
        List<Object[]> hourlyData = menuViewRepository.findHourlyViewDistribution(restaurantId, lastWeek);
        List<BasicAnalyticsDTO.ViewDistribution.HourlyData> hourlyViews = new ArrayList<>();
        String peakHour = "12:00";
        long peakViews = 0;

        for (Object[] row : hourlyData) {
            Integer hour = (Integer) row[0];
            Long views = (Long) row[1];
            hourlyViews.add(new BasicAnalyticsDTO.ViewDistribution.HourlyData(hour, views));

            if (views > peakViews) {
                peakViews = views;
                peakHour = String.format("%02d:00", hour);
            }
        }

        BasicAnalyticsDTO.ViewDistribution viewDistribution = new BasicAnalyticsDTO.ViewDistribution(
            hourlyViews, peakHour, peakViews);

        return new BasicAnalyticsDTO(totalViews, qrScans, uniqueVisitors, menuItems,
                                   mostViewedItems, dailyViews, updateActivities, viewDistribution);
    }
}
