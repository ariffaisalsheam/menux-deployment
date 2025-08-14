package com.menux.menu_x_backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.TransientDataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.concurrent.Callable;
import java.util.function.Supplier;

/**
 * Service for handling database operations with resilience patterns
 */
@Service
public class DatabaseResilienceService {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseResilienceService.class);

    @Autowired
    private DataSource dataSource;

    /**
     * Execute database operation with retry logic for transient failures
     */
    public <T> T executeWithRetry(Supplier<T> operation, String operationName) {
        return executeWithRetry(operation, operationName, 3);
    }

    public <T> T executeWithRetry(Supplier<T> operation, String operationName, int maxAttempts) {
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                logger.debug("Executing database operation: {} (attempt {}/{})", operationName, attempt, maxAttempts);
                long startTime = System.currentTimeMillis();

                T result = operation.get();

                long duration = System.currentTimeMillis() - startTime;
                if (duration > 5000) { // Log slow queries
                    logger.warn("Slow database operation '{}' took {} ms", operationName, duration);
                }

                return result;
            } catch (TransientDataAccessException e) {
                logger.warn("Transient database error in operation '{}' attempt {}/{}: {}",
                           operationName, attempt, maxAttempts, e.getMessage());
                if (attempt < maxAttempts) {
                    try {
                        Thread.sleep(1000 * attempt); // Exponential backoff
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new DataAccessException("Operation interrupted") {};
                    }
                    continue;
                }
            } catch (DataIntegrityViolationException e) {
                logger.error("Data integrity violation in operation '{}': {}", operationName, e.getMessage());
                throw e; // Don't retry integrity violations
            } catch (Exception e) {
                logger.error("Database operation '{}' failed: {}", operationName, e.getMessage(), e);
                throw e;
            }
        }

    // If we get here, all retries failed
    throw new DataAccessException("Database operation failed after " + maxAttempts + " attempts") {};
    }

    /**
     * Execute database operation with transaction and retry
     */
    @Transactional
    public <T> T executeTransactionalWithRetry(Supplier<T> operation, String operationName) {
        return executeWithRetry(operation, operationName);
    }

    /**
     * Check database connection health
     */
    public boolean isDatabaseHealthy() {
        try (Connection connection = dataSource.getConnection()) {
            return connection.isValid(5); // 5 second timeout
        } catch (SQLException e) {
            logger.error("Database health check failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Execute operation with circuit breaker pattern
     */
    public <T> T executeWithCircuitBreaker(Callable<T> operation, String operationName) {
        try {
            // Check if database is healthy before executing
            if (!isDatabaseHealthy()) {
                logger.error("Database is unhealthy, skipping operation: {}", operationName);
                throw new DataAccessException("Database is currently unavailable") {};
            }
            
            return operation.call();
        } catch (DataAccessException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Operation '{}' failed: {}", operationName, e.getMessage(), e);
            throw new DataAccessException("Operation failed: " + e.getMessage()) {};
        }
    }

    /**
     * Safe database operation with fallback
     */
    public <T> T executeWithFallback(Supplier<T> operation, Supplier<T> fallback, String operationName) {
        try {
            return executeWithRetry(operation, operationName);
        } catch (Exception e) {
            logger.warn("Database operation '{}' failed, using fallback: {}", operationName, e.getMessage());
            try {
                return fallback.get();
            } catch (Exception fallbackException) {
                logger.error("Fallback for operation '{}' also failed: {}", operationName, fallbackException.getMessage());
                throw new DataAccessException("Both primary and fallback operations failed") {};
            }
        }
    }

    /**
     * Validate database constraints before operation
     */
    public boolean validateConstraints(String tableName, String operation) {
        // This could be expanded to check specific constraints
        try {
            return isDatabaseHealthy();
        } catch (Exception e) {
            logger.error("Constraint validation failed for table '{}' operation '{}': {}", 
                        tableName, operation, e.getMessage());
            return false;
        }
    }

    /**
     * Handle concurrent access scenarios
     */
    @Transactional
    public <T> T executeWithOptimisticLocking(Supplier<T> operation, String operationName) {
        int maxRetries = 3;
        int attempt = 0;
        
        while (attempt < maxRetries) {
            try {
                return operation.get();
            } catch (Exception e) {
                attempt++;
                if (e.getMessage() != null && e.getMessage().contains("optimistic")) {
                    if (attempt < maxRetries) {
                        logger.warn("Optimistic locking conflict in '{}', retrying attempt {}/{}", 
                                   operationName, attempt, maxRetries);
                        try {
                            Thread.sleep(100 * attempt); // Exponential backoff
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            throw new DataAccessException("Operation interrupted") {};
                        }
                        continue;
                    }
                }
                throw e;
            }
        }
        
        throw new DataAccessException("Max retries exceeded for optimistic locking") {};
    }

    /**
     * Monitor database performance
     */
    public void logDatabaseMetrics() {
        try {
            long startTime = System.currentTimeMillis();
            boolean healthy = isDatabaseHealthy();
            long responseTime = System.currentTimeMillis() - startTime;
            
            if (healthy) {
                logger.info("Database health check passed in {} ms", responseTime);
            } else {
                logger.error("Database health check failed after {} ms", responseTime);
            }
            
            if (responseTime > 1000) {
                logger.warn("Database response time is slow: {} ms", responseTime);
            }
        } catch (Exception e) {
            logger.error("Failed to log database metrics: {}", e.getMessage());
        }
    }
}
