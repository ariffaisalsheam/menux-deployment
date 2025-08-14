package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.repository.AIProviderConfigRepository;
import com.menux.menu_x_backend.exception.AIServiceException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AIProviderServiceTest {

    private static final Logger logger = LoggerFactory.getLogger(AIProviderServiceTest.class);

    @Mock
    private AIProviderConfigRepository aiProviderConfigRepository;

    @Mock
    private EncryptionService encryptionService;

    @Mock
    private AIUsageService aiUsageService;

    @Mock
    private ExternalApiResilienceService resilienceService;

    private AIProviderService aiProviderService;

    @BeforeEach
    void setUp() {
        // Create AIProviderService with mocked dependencies
        aiProviderService = new AIProviderService(
            aiProviderConfigRepository,
            encryptionService,
            aiUsageService
        );

        // Use reflection to set the resilienceService field
        try {
            var resilienceServiceField = AIProviderService.class.getDeclaredField("resilienceService");
            resilienceServiceField.setAccessible(true);
            resilienceServiceField.set(aiProviderService, resilienceService);
        } catch (Exception e) {
            logger.error("Failed to set up test fields", e);
        }

        // Mock the repository to return empty list (no active providers)
        // This will trigger the fallback behavior we want to test
        when(aiProviderConfigRepository.findActiveProvidersOrderedByPriority())
            .thenReturn(Collections.emptyList());
    }

    @Test
    void testExceptionWhenNoActiveProviders() {
        // Test that the service throws exception when no providers are active
        AIServiceException exception = assertThrows(AIServiceException.class, () -> {
            aiProviderService.generateMenuDescription("Chicken Biryani");
        });

        // Should throw exception with user-friendly message
        assertEquals("AI service temporarily unavailable", exception.getMessage());
        assertEquals("NO_ACTIVE_PROVIDERS", exception.getErrorCode());
        logger.info("No providers exception test: {}", exception.getMessage());
    }

    @Test
    void testFeedbackAnalysisException() {
        // Test feedback analysis exception when no providers are active
        AIServiceException exception = assertThrows(AIServiceException.class, () -> {
            aiProviderService.analyzeFeedback("The food was great!");
        });

        // Should throw exception with user-friendly message
        assertEquals("AI service temporarily unavailable", exception.getMessage());
        assertEquals("NO_ACTIVE_PROVIDERS", exception.getErrorCode());
        logger.info("Feedback analysis exception test: {}", exception.getMessage());
    }

    @Test
    void testInvalidInputValidation() {
        // Test that null input throws appropriate exception
        AIServiceException exception = assertThrows(AIServiceException.class, () -> {
            aiProviderService.generateMenuDescription(null);
        });

        assertEquals("Invalid request data", exception.getMessage());
        assertEquals("INVALID_INPUT", exception.getErrorCode());

        // Test empty input
        exception = assertThrows(AIServiceException.class, () -> {
            aiProviderService.generateMenuDescription("   ");
        });

        assertEquals("Invalid request data", exception.getMessage());
        assertEquals("INVALID_INPUT", exception.getErrorCode());
        logger.info("Input validation test passed");
    }

    @Test
    void testDirectProviderCallsExist() {
        // Test that the direct provider call methods exist and can be called
        // These will fail with network errors but should not have compilation issues

        try {
            aiProviderService.testProviderDirectly("Z_AI", "test-key", "Hello");
        } catch (Exception e) {
            // Expected to fail - just testing method exists
            assertTrue(e.getMessage().contains("Z.AI") || e.getMessage().contains("connection") || e.getMessage().contains("Invalid"));
        }

        try {
            aiProviderService.testProviderDirectly("OPENROUTER", "test-key", "Hello");
        } catch (Exception e) {
            // Expected to fail - just testing method exists
            assertTrue(e.getMessage().contains("OpenRouter") || e.getMessage().contains("connection") || e.getMessage().contains("Invalid"));
        }

        try {
            aiProviderService.testProviderDirectly("GOOGLE_GEMINI", "test-key", "Hello");
        } catch (Exception e) {
            // Expected to fail - just testing method exists
            assertTrue(e.getMessage().contains("Gemini") || e.getMessage().contains("connection") || e.getMessage().contains("Invalid"));
        }
    }
}
