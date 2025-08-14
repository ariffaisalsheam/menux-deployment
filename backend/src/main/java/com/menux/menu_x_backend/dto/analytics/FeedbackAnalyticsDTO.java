package com.menux.menu_x_backend.dto.analytics;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class FeedbackAnalyticsDTO {
    private Double averageRating;
    private Long totalFeedback;

    // Sentiment buckets derived from rating if AI sentiment not available
    private Long positiveCount; // 4-5 stars
    private Long neutralCount;  // 3 stars
    private Long negativeCount; // 1-2 stars

    // Optional: distribution per rating star (1..5)
    private Map<Integer, Long> ratingDistribution;

    private List<RecentFeedback> recentFeedback;

    public FeedbackAnalyticsDTO() {}

    public FeedbackAnalyticsDTO(Double averageRating, Long totalFeedback,
                                Long positiveCount, Long neutralCount, Long negativeCount,
                                Map<Integer, Long> ratingDistribution,
                                List<RecentFeedback> recentFeedback) {
        this.averageRating = averageRating;
        this.totalFeedback = totalFeedback;
        this.positiveCount = positiveCount;
        this.neutralCount = neutralCount;
        this.negativeCount = negativeCount;
        this.ratingDistribution = ratingDistribution;
        this.recentFeedback = recentFeedback;
    }

    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }

    public Long getTotalFeedback() { return totalFeedback; }
    public void setTotalFeedback(Long totalFeedback) { this.totalFeedback = totalFeedback; }

    public Long getPositiveCount() { return positiveCount; }
    public void setPositiveCount(Long positiveCount) { this.positiveCount = positiveCount; }

    public Long getNeutralCount() { return neutralCount; }
    public void setNeutralCount(Long neutralCount) { this.neutralCount = neutralCount; }

    public Long getNegativeCount() { return negativeCount; }
    public void setNegativeCount(Long negativeCount) { this.negativeCount = negativeCount; }

    public Map<Integer, Long> getRatingDistribution() { return ratingDistribution; }
    public void setRatingDistribution(Map<Integer, Long> ratingDistribution) { this.ratingDistribution = ratingDistribution; }

    public List<RecentFeedback> getRecentFeedback() { return recentFeedback; }
    public void setRecentFeedback(List<RecentFeedback> recentFeedback) { this.recentFeedback = recentFeedback; }

    public static class RecentFeedback {
        private Long id;
        private Integer rating;
        private String comment;
        private String customerName;
        private LocalDateTime createdAt;

        public RecentFeedback() {}

        public RecentFeedback(Long id, Integer rating, String comment, String customerName, LocalDateTime createdAt) {
            this.id = id;
            this.rating = rating;
            this.comment = comment;
            this.customerName = customerName;
            this.createdAt = createdAt;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public Integer getRating() { return rating; }
        public void setRating(Integer rating) { this.rating = rating; }

        public String getComment() { return comment; }
        public void setComment(String comment) { this.comment = comment; }

        public String getCustomerName() { return customerName; }
        public void setCustomerName(String customerName) { this.customerName = customerName; }

        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }
}
