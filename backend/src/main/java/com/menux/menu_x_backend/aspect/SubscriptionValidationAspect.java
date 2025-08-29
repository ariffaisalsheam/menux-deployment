package com.menux.menu_x_backend.aspect;

import com.menux.menu_x_backend.annotation.RequireProSubscription;
import com.menux.menu_x_backend.service.RestaurantService;
import com.menux.menu_x_backend.service.SubscriptionService;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

/**
 * Aspect for validating PRO subscription requirements
 */
@Aspect
@Component
public class SubscriptionValidationAspect {
    
    private static final Logger logger = LoggerFactory.getLogger(SubscriptionValidationAspect.class);
    
    @Autowired
    private SubscriptionService subscriptionService;
    
    @Autowired
    private RestaurantService restaurantService;
    
    @Around("@annotation(requireProSubscription)")
    public Object validateProSubscription(ProceedingJoinPoint joinPoint, RequireProSubscription requireProSubscription) throws Throwable {
        try {
            // Get current user's restaurant ID
            Optional<Long> restaurantIdOpt = restaurantService.getCurrentUserRestaurantId();
            
            if (restaurantIdOpt.isEmpty()) {
                return handleValidationFailure(requireProSubscription, "No restaurant found for current user", joinPoint);
            }
            
            Long restaurantId = restaurantIdOpt.get();
            
            // Validate subscription
            boolean isValidPro = subscriptionService.isValidProSubscription(restaurantId);
            
            if (!isValidPro) {
                logger.warn("PRO subscription validation failed for restaurant {}", restaurantId);
                return handleValidationFailure(requireProSubscription, requireProSubscription.message(), joinPoint);
            }
            
            // Subscription is valid, proceed with method execution
            return joinPoint.proceed();
            
        } catch (Exception e) {
            logger.error("Error during subscription validation", e);
            
            if (requireProSubscription.gracefulDegradation()) {
                return handleGracefulDegradation(joinPoint);
            } else {
                return handleValidationFailure(requireProSubscription, "Subscription validation error", joinPoint);
            }
        }
    }
    
    private Object handleValidationFailure(RequireProSubscription annotation, String message, ProceedingJoinPoint joinPoint) {
        if (annotation.gracefulDegradation()) {
            return handleGracefulDegradation(joinPoint);
        }
        
        // Return appropriate error response based on return type
        Class<?> returnType = joinPoint.getSignature().getDeclaringType();
        
        // If method returns ResponseEntity, return 403 Forbidden
        if (joinPoint.getSignature().toString().contains("ResponseEntity")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", message, "code", "SUBSCRIPTION_REQUIRED"));
        }
        
        // For other return types, throw runtime exception
        throw new RuntimeException(message);
    }
    
    private Object handleGracefulDegradation(ProceedingJoinPoint joinPoint) {
        // Return appropriate default value based on return type
        String returnTypeName = joinPoint.getSignature().toString();
        
        if (returnTypeName.contains("ResponseEntity")) {
            return ResponseEntity.ok(Map.of("data", Map.of(), "limited", true, "reason", "Subscription required"));
        } else if (returnTypeName.contains("List")) {
            return java.util.Collections.emptyList();
        } else if (returnTypeName.contains("Optional")) {
            return Optional.empty();
        } else if (returnTypeName.contains("boolean")) {
            return false;
        }
        
        return null;
    }
}
