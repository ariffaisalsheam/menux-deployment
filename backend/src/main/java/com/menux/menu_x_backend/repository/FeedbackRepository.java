package com.menux.menu_x_backend.repository;

import com.menux.menu_x_backend.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    /**
     * Find all feedback for a specific restaurant
     */
    List<Feedback> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);

    /**
     * Find feedback by restaurant and rating
     */
    List<Feedback> findByRestaurantIdAndRatingOrderByCreatedAtDesc(Long restaurantId, Integer rating);

    /**
     * Find recent feedback for a restaurant
     */
    @Query("SELECT f FROM Feedback f WHERE f.restaurant.id = :restaurantId AND f.createdAt >= :since ORDER BY f.createdAt DESC")
    List<Feedback> findRecentFeedbackByRestaurant(@Param("restaurantId") Long restaurantId, @Param("since") LocalDateTime since);

    /**
     * Get average rating for a restaurant
     */
    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.restaurant.id = :restaurantId")
    Double getAverageRatingByRestaurant(@Param("restaurantId") Long restaurantId);

    /**
     * Get average rating for a restaurant within a time range
     */
    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.restaurant.id = :restaurantId AND f.createdAt BETWEEN :start AND :end")
    Double getAverageRatingByRestaurantBetween(@Param("restaurantId") Long restaurantId,
                                               @Param("start") LocalDateTime start,
                                               @Param("end") LocalDateTime end);

    /**
     * Count feedback by restaurant
     */
    Long countByRestaurantId(Long restaurantId);

    /**
     * Count feedback by restaurant within a time range
     */
    @Query("SELECT COUNT(f) FROM Feedback f WHERE f.restaurant.id = :restaurantId AND f.createdAt BETWEEN :start AND :end")
    Long countByRestaurantIdAndCreatedAtBetween(@Param("restaurantId") Long restaurantId,
                                                @Param("start") LocalDateTime start,
                                                @Param("end") LocalDateTime end);

    /**
     * Find feedback by order number
     */
    List<Feedback> findByOrderNumberOrderByCreatedAtDesc(String orderNumber);

    /**
     * Find feedback by customer email
     */
    List<Feedback> findByCustomerEmailOrderByCreatedAtDesc(String customerEmail);

    /**
     * Get feedback statistics for a restaurant
     */
    @Query("SELECT f.rating, COUNT(f) FROM Feedback f WHERE f.restaurant.id = :restaurantId GROUP BY f.rating ORDER BY f.rating")
    List<Object[]> getFeedbackStatsByRestaurant(@Param("restaurantId") Long restaurantId);
}
