package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.exception.ExternalServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

/**
 * Service for handling external API calls with resilience patterns
 */
@Service
public class ExternalApiResilienceService {

    private static final Logger logger = LoggerFactory.getLogger(ExternalApiResilienceService.class);

    // Circuit breaker state tracking
    private final ConcurrentHashMap<String, CircuitBreakerState> circuitBreakers = new ConcurrentHashMap<>();
    
    // Rate limiting tracking
    private final ConcurrentHashMap<String, RateLimitState> rateLimits = new ConcurrentHashMap<>();

    /**
     * Execute external API call with comprehensive resilience patterns
     */
    public <T> T executeWithResilience(String serviceName, Supplier<T> apiCall, Supplier<T> fallback) {
        // Check circuit breaker
        if (isCircuitOpen(serviceName)) {
            logger.warn("Circuit breaker is open for service: {}", serviceName);
            return executeFallback(serviceName, fallback);
        }

        // Check rate limiting
        if (isRateLimited(serviceName)) {
            logger.warn("Rate limit exceeded for service: {}", serviceName);
            throw new ExternalServiceException(serviceName, "Rate limit exceeded", "RATE_LIMIT_EXCEEDED", false);
        }

        try {
            return executeWithRetryAndTimeout(serviceName, apiCall);
        } catch (Exception e) {
            recordFailure(serviceName, e);
            return executeFallback(serviceName, fallback);
        }
    }

    /**
     * Execute API call with retry logic and timeout
     */
    private <T> T executeWithRetryAndTimeout(String serviceName, Supplier<T> apiCall) {
        return executeWithRetryAndTimeout(serviceName, apiCall, 3);
    }

    private <T> T executeWithRetryAndTimeout(String serviceName, Supplier<T> apiCall, int maxAttempts) {
        Exception lastException = null;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            long startTime = System.currentTimeMillis();

            try {
                logger.debug("Executing API call for service: {} (attempt {}/{})", serviceName, attempt, maxAttempts);

                T result = apiCall.get();

                long duration = System.currentTimeMillis() - startTime;
                recordSuccess(serviceName, duration);

                return result;
            } catch (Exception e) {
                lastException = e;
                long duration = System.currentTimeMillis() - startTime;
                logger.error("API call failed for service '{}' attempt {}/{} after {} ms: {}",
                           serviceName, attempt, maxAttempts, duration, e.getMessage());

                if (attempt < maxAttempts && (e instanceof ConnectException || e instanceof SocketTimeoutException)) {
                    try {
                        Thread.sleep(1000 * attempt); // Exponential backoff
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new ExternalServiceException(serviceName, "Operation interrupted", "INTERRUPTED", false);
                    }
                    continue;
                }
            }
        }

        // All retries failed
        if (lastException != null) {
            if (lastException instanceof ConnectException || lastException instanceof SocketTimeoutException) {
                throw new ExternalServiceException(serviceName, "Connection timeout after retries", "TIMEOUT", lastException, true);
            }
            throw new ExternalServiceException(serviceName, "API call failed after retries: " + lastException.getMessage(), "API_ERROR", lastException, true);
        }

        throw new ExternalServiceException(serviceName, "API call failed after retries", "API_ERROR", true);
    }

    /**
     * Execute fallback with error handling
     */
    private <T> T executeFallback(String serviceName, Supplier<T> fallback) {
        if (fallback == null) {
            throw new ExternalServiceException(serviceName, "Service unavailable and no fallback provided", "NO_FALLBACK", false);
        }

        try {
            logger.info("Executing fallback for service: {}", serviceName);
            return fallback.get();
        } catch (Exception e) {
            logger.error("Fallback failed for service '{}': {}", serviceName, e.getMessage());
            throw new ExternalServiceException(serviceName, "Both primary and fallback failed", "FALLBACK_FAILED", e, false);
        }
    }

    /**
     * Check if circuit breaker is open
     */
    private boolean isCircuitOpen(String serviceName) {
        CircuitBreakerState state = circuitBreakers.get(serviceName);
        if (state == null) {
            return false;
        }

        if (state.state == CircuitState.OPEN) {
            // Check if we should try to close the circuit
            if (LocalDateTime.now().isAfter(state.nextRetryTime)) {
                state.state = CircuitState.HALF_OPEN;
                logger.info("Circuit breaker for '{}' moved to HALF_OPEN", serviceName);
                return false;
            }
            return true;
        }

        return false;
    }

    /**
     * Check if service is rate limited
     */
    private boolean isRateLimited(String serviceName) {
        RateLimitState state = rateLimits.computeIfAbsent(serviceName, k -> new RateLimitState());
        
        LocalDateTime now = LocalDateTime.now();
        
        // Reset counter if window has passed
        if (now.isAfter(state.windowStart.plusMinutes(1))) {
            state.requestCount = 0;
            state.windowStart = now;
        }

        state.requestCount++;
        
        // Different limits for different services
        int limit = getServiceRateLimit(serviceName);
        return state.requestCount > limit;
    }

    /**
     * Get rate limit for specific service
     */
    private int getServiceRateLimit(String serviceName) {
        switch (serviceName.toLowerCase()) {
            case "google_gemini":
            case "openai":
                return 10; // 10 requests per minute for AI services
            case "payment":
                return 5;  // 5 requests per minute for payment services
            default:
                return 20; // Default 20 requests per minute
        }
    }

    /**
     * Record successful API call
     */
    private void recordSuccess(String serviceName, long duration) {
        CircuitBreakerState state = circuitBreakers.computeIfAbsent(serviceName, k -> new CircuitBreakerState());
        
        state.successCount++;
        state.lastSuccessTime = LocalDateTime.now();
        
        if (state.state == CircuitState.HALF_OPEN) {
            state.state = CircuitState.CLOSED;
            state.failureCount = 0;
            logger.info("Circuit breaker for '{}' closed after successful call", serviceName);
        }

        if (duration > 5000) {
            logger.warn("Slow API response from '{}': {} ms", serviceName, duration);
        }
    }

    /**
     * Record failed API call
     */
    private void recordFailure(String serviceName, Exception e) {
        CircuitBreakerState state = circuitBreakers.computeIfAbsent(serviceName, k -> new CircuitBreakerState());
        
        state.failureCount++;
        state.lastFailureTime = LocalDateTime.now();
        state.lastError = e.getMessage();

        // Open circuit if failure threshold reached
        if (state.failureCount >= 5 && state.state != CircuitState.OPEN) {
            state.state = CircuitState.OPEN;
            state.nextRetryTime = LocalDateTime.now().plusMinutes(5); // 5 minute timeout
            logger.error("Circuit breaker opened for service '{}' after {} failures", serviceName, state.failureCount);
        }
    }

    /**
     * Get service health status
     */
    public ServiceHealthStatus getServiceHealth(String serviceName) {
        CircuitBreakerState state = circuitBreakers.get(serviceName);
        if (state == null) {
            return new ServiceHealthStatus(serviceName, true, "No data", 0, 0, null, null, null);
        }

        boolean healthy = state.state == CircuitState.CLOSED;
        String status = state.state.toString();
        
        return new ServiceHealthStatus(serviceName, healthy, status, state.successCount, state.failureCount,
                state.lastFailureTime, state.lastSuccessTime, state.lastError);
    }

    /**
     * Reset circuit breaker for a service
     */
    public void resetCircuitBreaker(String serviceName) {
        CircuitBreakerState state = circuitBreakers.get(serviceName);
        if (state != null) {
            state.state = CircuitState.CLOSED;
            state.failureCount = 0;
            state.successCount = 0;
            logger.info("Circuit breaker reset for service: {}", serviceName);
        }
    }

    // Inner classes for state management
    private static class CircuitBreakerState {
        CircuitState state = CircuitState.CLOSED;
        int failureCount = 0;
        int successCount = 0;
        LocalDateTime lastFailureTime;
        LocalDateTime lastSuccessTime;
        LocalDateTime nextRetryTime;
        String lastError;
    }

    private static class RateLimitState {
        int requestCount = 0;
        LocalDateTime windowStart = LocalDateTime.now();
    }

    private enum CircuitState {
        CLOSED, OPEN, HALF_OPEN
    }

    public static class ServiceHealthStatus {
        private final String serviceName;
        private final boolean healthy;
        private final String status;
        private final int successCount;
        private final int failureCount;
        private final LocalDateTime lastFailureTime;
        private final LocalDateTime lastSuccessTime;
        private final String lastError;

        public ServiceHealthStatus(String serviceName, boolean healthy, String status, int successCount, int failureCount,
                                   LocalDateTime lastFailureTime, LocalDateTime lastSuccessTime, String lastError) {
            this.serviceName = serviceName;
            this.healthy = healthy;
            this.status = status;
            this.successCount = successCount;
            this.failureCount = failureCount;
            this.lastFailureTime = lastFailureTime;
            this.lastSuccessTime = lastSuccessTime;
            this.lastError = lastError;
        }

        // Getters
        public String getServiceName() { return serviceName; }
        public boolean isHealthy() { return healthy; }
        public String getStatus() { return status; }
        public int getSuccessCount() { return successCount; }
        public int getFailureCount() { return failureCount; }
        public LocalDateTime getLastFailureTime() { return lastFailureTime; }
        public LocalDateTime getLastSuccessTime() { return lastSuccessTime; }
        public String getLastError() { return lastError; }
    }
}
