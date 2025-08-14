package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.service.DatabaseResilienceService;
import com.menux.menu_x_backend.service.ExternalApiResilienceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Health check endpoints for monitoring application status
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    private static final Logger logger = LoggerFactory.getLogger(HealthController.class);

    @Autowired
    private DatabaseResilienceService databaseResilienceService;

    @Autowired
    private ExternalApiResilienceService externalApiResilienceService;

    @Autowired
    private DataSource dataSource;

    /**
     * Basic health check endpoint
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", LocalDateTime.now());
        health.put("application", "Menu.X Backend");
        health.put("version", "1.0.0");
        
        return ResponseEntity.ok(health);
    }

    /**
     * Detailed health check with all components
     */
    @GetMapping("/detailed")
    public ResponseEntity<Map<String, Object>> detailedHealth() {
        Map<String, Object> health = new HashMap<>();
        boolean overallHealthy = true;
        
        // Application info
        health.put("timestamp", LocalDateTime.now());
        health.put("application", "Menu.X Backend");
        health.put("version", "1.0.0");
        
        // Database health
        Map<String, Object> databaseHealth = checkDatabaseHealth();
        health.put("database", databaseHealth);
        if (!"UP".equals(databaseHealth.get("status"))) {
            overallHealthy = false;
        }
        
        // External services health
        Map<String, Object> externalServices = checkExternalServicesHealth();
        health.put("externalServices", externalServices);
        
        // Memory usage
        Map<String, Object> memory = getMemoryInfo();
        health.put("memory", memory);
        
        // Overall status
        health.put("status", overallHealthy ? "UP" : "DOWN");
        
        HttpStatus status = overallHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
        return ResponseEntity.status(status).body(health);
    }

    /**
     * Database-specific health check
     */
    @GetMapping("/database")
    public ResponseEntity<Map<String, Object>> databaseHealth() {
        Map<String, Object> health = checkDatabaseHealth();
        HttpStatus status = "UP".equals(health.get("status")) ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
        return ResponseEntity.status(status).body(health);
    }

    /**
     * External services health check
     */
    @GetMapping("/external")
    public ResponseEntity<Map<String, Object>> externalServicesHealth() {
        Map<String, Object> health = checkExternalServicesHealth();
        return ResponseEntity.ok(health);
    }

    /**
     * Application metrics
     */
    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> metrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        // Memory metrics
        metrics.put("memory", getMemoryInfo());
        
        // Database metrics
        metrics.put("database", getDatabaseMetrics());
        
        // External service metrics
        metrics.put("externalServices", getExternalServiceMetrics());
        
        // System metrics
        metrics.put("system", getSystemMetrics());
        
        return ResponseEntity.ok(metrics);
    }

    /**
     * Readiness probe for Kubernetes
     */
    @GetMapping("/ready")
    public ResponseEntity<Map<String, String>> readiness() {
        boolean ready = databaseResilienceService.isDatabaseHealthy();
        
        Map<String, String> response = new HashMap<>();
        response.put("status", ready ? "READY" : "NOT_READY");
        response.put("timestamp", LocalDateTime.now().toString());
        
        HttpStatus status = ready ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
        return ResponseEntity.status(status).body(response);
    }

    /**
     * Liveness probe for Kubernetes
     */
    @GetMapping("/live")
    public ResponseEntity<Map<String, String>> liveness() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "ALIVE");
        response.put("timestamp", LocalDateTime.now().toString());
        
        return ResponseEntity.ok(response);
    }

    // Private helper methods
    private Map<String, Object> checkDatabaseHealth() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            long startTime = System.currentTimeMillis();
            boolean healthy = databaseResilienceService.isDatabaseHealthy();
            long responseTime = System.currentTimeMillis() - startTime;
            
            health.put("status", healthy ? "UP" : "DOWN");
            health.put("responseTime", responseTime + "ms");
            health.put("timestamp", LocalDateTime.now());
            
            if (healthy) {
                health.put("details", "Database connection successful");
            } else {
                health.put("details", "Database connection failed");
            }
            
        } catch (Exception e) {
            health.put("status", "DOWN");
            health.put("error", e.getMessage());
            health.put("timestamp", LocalDateTime.now());
            logger.error("Database health check failed", e);
        }
        
        return health;
    }

    private Map<String, Object> checkExternalServicesHealth() {
        Map<String, Object> services = new HashMap<>();
        
        // Check AI services
        String[] aiServices = {"google_gemini", "openai", "openrouter"};
        for (String service : aiServices) {
            ExternalApiResilienceService.ServiceHealthStatus status = 
                externalApiResilienceService.getServiceHealth(service);
            
            Map<String, Object> serviceHealth = new HashMap<>();
            serviceHealth.put("healthy", status.isHealthy());
            serviceHealth.put("status", status.getStatus());
            serviceHealth.put("successCount", status.getSuccessCount());
            serviceHealth.put("failureCount", status.getFailureCount());
            
            services.put(service, serviceHealth);
        }
        
        return services;
    }

    private Map<String, Object> getMemoryInfo() {
        Runtime runtime = Runtime.getRuntime();
        Map<String, Object> memory = new HashMap<>();
        
        long maxMemory = runtime.maxMemory();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        
        memory.put("max", formatBytes(maxMemory));
        memory.put("total", formatBytes(totalMemory));
        memory.put("used", formatBytes(usedMemory));
        memory.put("free", formatBytes(freeMemory));
        memory.put("usagePercentage", Math.round((double) usedMemory / totalMemory * 100));
        
        return memory;
    }

    private Map<String, Object> getDatabaseMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        try (Connection connection = dataSource.getConnection()) {
            metrics.put("activeConnections", connection.getMetaData().getMaxConnections());
            metrics.put("databaseProduct", connection.getMetaData().getDatabaseProductName());
            metrics.put("databaseVersion", connection.getMetaData().getDatabaseProductVersion());
        } catch (Exception e) {
            metrics.put("error", "Unable to retrieve database metrics: " + e.getMessage());
        }
        
        return metrics;
    }

    private Map<String, Object> getExternalServiceMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        // This could be expanded to include more detailed metrics
        metrics.put("circuitBreakers", "Monitoring active");
        metrics.put("rateLimiting", "Active");
        
        return metrics;
    }

    private Map<String, Object> getSystemMetrics() {
        Map<String, Object> system = new HashMap<>();
        
        system.put("processors", Runtime.getRuntime().availableProcessors());
        system.put("javaVersion", System.getProperty("java.version"));
        system.put("osName", System.getProperty("os.name"));
        system.put("osVersion", System.getProperty("os.version"));
        
        return system;
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.1f GB", bytes / (1024.0 * 1024 * 1024));
    }
}
