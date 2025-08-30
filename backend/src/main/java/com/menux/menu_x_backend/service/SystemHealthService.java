package com.menux.menu_x_backend.service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class SystemHealthService {

    private static final Logger logger = LoggerFactory.getLogger(SystemHealthService.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Calculate overall system health percentage based on various metrics
     */
    public Double calculateSystemHealth() {
        List<HealthCheck> checks = new ArrayList<>();
        
        // Database connectivity check (40% weight)
        checks.add(new HealthCheck(checkDatabaseHealth(), 40.0));
        
        // API response time check (30% weight)
        checks.add(new HealthCheck(checkApiResponseTime(), 30.0));
        
        // Recent error rate check (20% weight)
        checks.add(new HealthCheck(checkErrorRate(), 20.0));
        
        // Service availability check (10% weight)
        checks.add(new HealthCheck(checkServiceAvailability(), 10.0));
        
        // Calculate weighted average
        double totalWeight = 0.0;
        double weightedSum = 0.0;
        
        for (HealthCheck check : checks) {
            if (check.isHealthy()) {
                weightedSum += check.getWeight();
            }
            totalWeight += check.getWeight();
        }
        
        double healthPercentage = totalWeight > 0 ? (weightedSum / totalWeight) * 100.0 : 0.0;
        
        // Ensure health is between 0 and 100
        return Math.max(0.0, Math.min(100.0, healthPercentage));
    }

    /**
     * Check database connectivity and response time
     */
    private boolean checkDatabaseHealth() {
        try {
            long startTime = System.currentTimeMillis();
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            long responseTime = System.currentTimeMillis() - startTime;
            
            // Consider healthy if response time is under 1000ms
            return responseTime < 1000;
        } catch (DataAccessException e) {
            logger.warn("Database health check failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Check API response time by measuring a simple database query
     */
    private boolean checkApiResponseTime() {
        try {
            long startTime = System.currentTimeMillis();
            jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Long.class);
            long responseTime = System.currentTimeMillis() - startTime;
            
            // Consider healthy if response time is under 500ms
            return responseTime < 500;
        } catch (DataAccessException e) {
            logger.warn("API response time check failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Check recent error rate by examining audit logs or application logs
     */
    private boolean checkErrorRate() {
        try {
            // Check for recent errors in the last hour
            LocalDateTime oneHourAgo = LocalDateTime.now().minus(1, ChronoUnit.HOURS);
            
            // Count total audit log entries in the last hour
            Long totalActions = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM audit_logs WHERE created_at > ?", 
                Long.class, oneHourAgo
            );
            
            if (totalActions == null || totalActions == 0) {
                return true; // No activity, assume healthy
            }
            
            // For now, assume healthy since we don't track error-specific audit logs
            // In a real implementation, you would count error actions vs total actions
            return true;
        } catch (DataAccessException e) {
            logger.warn("Error rate check failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Check service availability by verifying core services are running
     */
    private boolean checkServiceAvailability() {
        try {
            // Check if we can access core tables
            jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users LIMIT 1", Long.class);
            jdbcTemplate.queryForObject("SELECT COUNT(*) FROM restaurants LIMIT 1", Long.class);
            jdbcTemplate.queryForObject("SELECT COUNT(*) FROM orders LIMIT 1", Long.class);
            
            return true;
        } catch (DataAccessException e) {
            logger.warn("Service availability check failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Get detailed health status for debugging
     */
    public SystemHealthStatus getDetailedHealthStatus() {
        boolean dbHealth = checkDatabaseHealth();
        boolean apiHealth = checkApiResponseTime();
        boolean errorHealth = checkErrorRate();
        boolean serviceHealth = checkServiceAvailability();
        
        Double overallHealth = calculateSystemHealth();
        
        return new SystemHealthStatus(
            overallHealth,
            dbHealth,
            apiHealth,
            errorHealth,
            serviceHealth,
            LocalDateTime.now()
        );
    }

    /**
     * Internal class for health checks
     */
    private static class HealthCheck {
        private final boolean healthy;
        private final double weight;

        public HealthCheck(boolean healthy, double weight) {
            this.healthy = healthy;
            this.weight = weight;
        }

        public boolean isHealthy() { return healthy; }
        public double getWeight() { return weight; }
    }

    /**
     * System health status DTO
     */
    public static class SystemHealthStatus {
        private final Double overallHealth;
        private final boolean databaseHealthy;
        private final boolean apiHealthy;
        private final boolean errorRateHealthy;
        private final boolean serviceHealthy;
        private final LocalDateTime timestamp;

        public SystemHealthStatus(Double overallHealth, boolean databaseHealthy, 
                                boolean apiHealthy, boolean errorRateHealthy, 
                                boolean serviceHealthy, LocalDateTime timestamp) {
            this.overallHealth = overallHealth;
            this.databaseHealthy = databaseHealthy;
            this.apiHealthy = apiHealthy;
            this.errorRateHealthy = errorRateHealthy;
            this.serviceHealthy = serviceHealthy;
            this.timestamp = timestamp;
        }

        // Getters
        public Double getOverallHealth() { return overallHealth; }
        public boolean isDatabaseHealthy() { return databaseHealthy; }
        public boolean isApiHealthy() { return apiHealthy; }
        public boolean isErrorRateHealthy() { return errorRateHealthy; }
        public boolean isServiceHealthy() { return serviceHealthy; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }
}
