package com.menux.menu_x_backend.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for subscription-related errors
 */
@ControllerAdvice
public class SubscriptionExceptionHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(SubscriptionExceptionHandler.class);
    
    @ExceptionHandler(SubscriptionException.class)
    public ResponseEntity<Map<String, Object>> handleSubscriptionException(SubscriptionException ex) {
        logger.warn("Subscription error: {} - {}", ex.getErrorCode(), ex.getMessage());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", ex.getMessage());
        errorResponse.put("errorCode", ex.getErrorCode());
        errorResponse.put("errorType", ex.getErrorType().name());
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        
        if (ex.getRestaurantId() != null) {
            errorResponse.put("restaurantId", ex.getRestaurantId());
        }
        
        // Map error types to appropriate HTTP status codes
        HttpStatus status = mapErrorTypeToHttpStatus(ex.getErrorType());
        
        return ResponseEntity.status(status).body(errorResponse);
    }
    
    private HttpStatus mapErrorTypeToHttpStatus(SubscriptionException.ErrorType errorType) {
        switch (errorType) {
            case RESTAURANT_NOT_FOUND:
            case SUBSCRIPTION_NOT_FOUND:
                return HttpStatus.NOT_FOUND;
                
            case INVALID_PARAMETERS:
                return HttpStatus.BAD_REQUEST;
                
            case INVALID_STATE_TRANSITION:
            case ALREADY_SUSPENDED:
            case NOT_SUSPENDED:
            case TRIAL_ALREADY_USED:
                return HttpStatus.CONFLICT;
                
            case PAYMENT_REQUIRED:
                return HttpStatus.PAYMENT_REQUIRED;
                
            case GRACE_PERIOD_EXPIRED:
                return HttpStatus.FORBIDDEN;
                
            case SYSTEM_ERROR:
            default:
                return HttpStatus.INTERNAL_SERVER_ERROR;
        }
    }
}
