package com.menux.menu_x_backend.integration;

import com.menux.menu_x_backend.exception.BusinessLogicException;
import com.menux.menu_x_backend.exception.ExternalServiceException;
import com.menux.menu_x_backend.exception.ValidationException;
import com.menux.menu_x_backend.service.DatabaseResilienceService;
import com.menux.menu_x_backend.service.ExternalApiResilienceService;
import com.menux.menu_x_backend.util.InputSanitizer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for error handling and resilience features
 */
@SpringBootTest
@ActiveProfiles("test")
public class ErrorHandlingResilienceTest {

    @Autowired
    private DatabaseResilienceService databaseResilienceService;

    @Autowired
    private ExternalApiResilienceService externalApiResilienceService;

    @Autowired
    private InputSanitizer inputSanitizer;

    @Test
    void testDatabaseResilienceServiceHealthCheck() {
        // Test database health check
        boolean healthy = databaseResilienceService.isDatabaseHealthy();
        assertTrue(healthy, "Database should be healthy in test environment");
    }

    @Test
    void testDatabaseRetryMechanism() {
        // Test successful operation
        String result = databaseResilienceService.executeWithRetry(
            () -> "success",
            "test-operation"
        );
        assertEquals("success", result);
    }

    @Test
    void testDatabaseRetryWithFailure() {
        // Test operation that fails initially but succeeds on retry
        final int[] attempts = {0};
        
        String result = databaseResilienceService.executeWithRetry(
            () -> {
                attempts[0]++;
                if (attempts[0] < 2) {
                    throw new RuntimeException("Simulated transient failure");
                }
                return "success-after-retry";
            },
            "test-retry-operation",
            3
        );
        
        assertEquals("success-after-retry", result);
        assertEquals(2, attempts[0], "Should have retried once");
    }

    @Test
    void testDatabaseFallbackMechanism() {
        // Test fallback when primary operation fails
        String result = databaseResilienceService.executeWithFallback(
            () -> {
                throw new RuntimeException("Primary operation failed");
            },
            () -> "fallback-result",
            "test-fallback-operation"
        );
        
        assertEquals("fallback-result", result);
    }

    @Test
    void testExternalApiCircuitBreaker() {
        String serviceName = "test-service";
        
        // Test successful call
        String result = externalApiResilienceService.executeWithResilience(
            serviceName,
            () -> "api-success",
            () -> "fallback"
        );
        
        assertEquals("api-success", result);
        
        // Check service health
        ExternalApiResilienceService.ServiceHealthStatus health = 
            externalApiResilienceService.getServiceHealth(serviceName);
        assertTrue(health.isHealthy());
    }

    @Test
    void testExternalApiWithFallback() {
        String serviceName = "failing-service";
        
        // Test API call that fails and uses fallback
        String result = externalApiResilienceService.executeWithResilience(
            serviceName,
            () -> {
                throw new RuntimeException("API call failed");
            },
            () -> "fallback-response"
        );
        
        assertEquals("fallback-response", result);
    }

    @Test
    void testInputSanitization() {
        // Test email validation
        assertTrue(inputSanitizer.isValidEmail("test@example.com"));
        assertFalse(inputSanitizer.isValidEmail("invalid-email"));
        
        // Test phone number validation
        assertTrue(inputSanitizer.isValidPhoneNumber("+8801234567890"));
        assertFalse(inputSanitizer.isValidPhoneNumber("invalid-phone"));
        
        // Test text sanitization
        String maliciousInput = "<script>alert('xss')</script>Hello World";
        String sanitized = inputSanitizer.sanitizeText(maliciousInput, 100);
        assertFalse(sanitized.contains("<script>"));
        assertTrue(sanitized.contains("Hello World"));
        
        // Test SQL injection detection
        assertTrue(inputSanitizer.containsSQLInjection("'; DROP TABLE users; --"));
        assertFalse(inputSanitizer.containsSQLInjection("normal text"));
        
        // Test XSS detection
        assertTrue(inputSanitizer.containsXSS("<script>alert('xss')</script>"));
        assertFalse(inputSanitizer.containsXSS("normal text"));
    }

    @Test
    void testFileUploadValidation() {
        // Test valid file uploads
        assertTrue(inputSanitizer.isValidFileUpload("image.jpg", 1024 * 1024, "image/jpeg"));
        assertTrue(inputSanitizer.isValidFileUpload("document.pdf", 2 * 1024 * 1024, "application/pdf"));
        
        // Test invalid file uploads
        assertFalse(inputSanitizer.isValidFileUpload("malicious.exe", 1024, "application/octet-stream"));
        assertFalse(inputSanitizer.isValidFileUpload("large.jpg", 20 * 1024 * 1024, "image/jpeg")); // Too large
        assertFalse(inputSanitizer.isValidFileUpload("", 1024, "image/jpeg")); // Empty filename
    }

    @Test
    void testCustomExceptions() {
        // Test BusinessLogicException
        BusinessLogicException businessException = new BusinessLogicException("Business rule violated", "INVALID_OPERATION");
        assertEquals("Business rule violated", businessException.getMessage());
        assertEquals("INVALID_OPERATION", businessException.getErrorCode());
        
        // Test ExternalServiceException
        ExternalServiceException serviceException = new ExternalServiceException("test-service", "Service unavailable", "SERVICE_DOWN", true);
        assertEquals("test-service", serviceException.getServiceName());
        assertEquals("Service unavailable", serviceException.getMessage());
        assertEquals("SERVICE_DOWN", serviceException.getErrorCode());
        assertTrue(serviceException.isRetryable());
        
        // Test ValidationException
        Map<String, String> fieldErrors = Map.of("email", "Invalid email format", "phone", "Invalid phone number");
        ValidationException validationException = new ValidationException("Validation failed", fieldErrors);
        assertEquals("Validation failed", validationException.getMessage());
        assertTrue(validationException.hasFieldErrors());
        assertEquals(2, validationException.getFieldErrors().size());
    }

    @Test
    void testPasswordValidation() {
        // Test valid passwords
        assertTrue(inputSanitizer.isValidPassword("password123"));
        assertTrue(inputSanitizer.isValidPassword("strongP@ssw0rd"));
        
        // Test invalid passwords
        assertFalse(inputSanitizer.isValidPassword("123")); // Too short
        assertFalse(inputSanitizer.isValidPassword("")); // Empty
        assertFalse(inputSanitizer.isValidPassword(null)); // Null
    }

    @Test
    void testUsernameValidation() {
        // Test valid usernames
        assertTrue(inputSanitizer.isValidUsername("user123"));
        assertTrue(inputSanitizer.isValidUsername("test_user"));
        assertTrue(inputSanitizer.isValidUsername("validuser"));
        
        // Test invalid usernames
        assertFalse(inputSanitizer.isValidUsername("ab")); // Too short
        assertFalse(inputSanitizer.isValidUsername("user@domain")); // Invalid characters
        assertFalse(inputSanitizer.isValidUsername("")); // Empty
        assertFalse(inputSanitizer.isValidUsername(null)); // Null
    }

    @Test
    void testPriceValidation() {
        // Test valid prices
        assertTrue(inputSanitizer.isValidPrice("10.50"));
        assertTrue(inputSanitizer.isValidPrice("0"));
        assertTrue(inputSanitizer.isValidPrice("999999.99"));
        
        // Test invalid prices
        assertFalse(inputSanitizer.isValidPrice("-10")); // Negative
        assertFalse(inputSanitizer.isValidPrice("invalid")); // Non-numeric
        assertFalse(inputSanitizer.isValidPrice("")); // Empty
        assertFalse(inputSanitizer.isValidPrice(null)); // Null
        assertFalse(inputSanitizer.isValidPrice("1000000")); // Too large
    }

    @Test
    void testAddressSanitization() {
        String address = "123 Main St, <script>alert('xss')</script> Dhaka";
        String sanitized = inputSanitizer.sanitizeAddress(address);
        
        assertFalse(sanitized.contains("<script>"));
        assertTrue(sanitized.contains("123 Main St"));
        assertTrue(sanitized.contains("Dhaka"));
    }

    @Test
    void testMenuItemNameSanitization() {
        String menuItem = "Chicken Burger <script>alert('xss')</script> & Fries";
        String sanitized = inputSanitizer.sanitizeMenuItemName(menuItem);
        
        assertFalse(sanitized.contains("<script>"));
        assertTrue(sanitized.contains("Chicken Burger"));
        assertTrue(sanitized.contains("& Fries"));
    }

    @Test
    void testCircuitBreakerReset() {
        String serviceName = "reset-test-service";
        
        // Reset circuit breaker
        externalApiResilienceService.resetCircuitBreaker(serviceName);
        
        // Check that service is healthy after reset
        ExternalApiResilienceService.ServiceHealthStatus health = 
            externalApiResilienceService.getServiceHealth(serviceName);
        assertTrue(health.isHealthy());
    }

    @Test
    void testDatabaseConstraintValidation() {
        // Test constraint validation
        boolean valid = databaseResilienceService.validateConstraints("test_table", "INSERT");
        assertTrue(valid, "Constraint validation should pass in test environment");
    }

    @Test
    void testPerformanceMonitoring() {
        // Test database metrics logging (should not throw exceptions)
        assertDoesNotThrow(() -> {
            databaseResilienceService.logDatabaseMetrics();
        });
    }
}
