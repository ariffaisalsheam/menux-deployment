package com.menux.menu_x_backend.exception;

/**
 * Custom exception for subscription-related errors
 */
public class SubscriptionException extends RuntimeException {
    
    public enum ErrorType {
        RESTAURANT_NOT_FOUND,
        INVALID_STATE_TRANSITION,
        INVALID_PARAMETERS,
        SUBSCRIPTION_NOT_FOUND,
        ALREADY_SUSPENDED,
        NOT_SUSPENDED,
        PAYMENT_REQUIRED,
        TRIAL_ALREADY_USED,
        GRACE_PERIOD_EXPIRED,
        SYSTEM_ERROR
    }
    
    private final ErrorType errorType;
    private final Long restaurantId;
    
    public SubscriptionException(ErrorType errorType, String message) {
        super(message);
        this.errorType = errorType;
        this.restaurantId = null;
    }
    
    public SubscriptionException(ErrorType errorType, String message, Long restaurantId) {
        super(message);
        this.errorType = errorType;
        this.restaurantId = restaurantId;
    }
    
    public SubscriptionException(ErrorType errorType, String message, Throwable cause) {
        super(message, cause);
        this.errorType = errorType;
        this.restaurantId = null;
    }
    
    public SubscriptionException(ErrorType errorType, String message, Long restaurantId, Throwable cause) {
        super(message, cause);
        this.errorType = errorType;
        this.restaurantId = restaurantId;
    }
    
    public ErrorType getErrorType() {
        return errorType;
    }
    
    public Long getRestaurantId() {
        return restaurantId;
    }
    
    public String getErrorCode() {
        return errorType.name();
    }
    
    // Static factory methods for common errors
    public static SubscriptionException restaurantNotFound(Long restaurantId) {
        return new SubscriptionException(
            ErrorType.RESTAURANT_NOT_FOUND,
            "Restaurant not found with ID: " + restaurantId,
            restaurantId
        );
    }
    
    public static SubscriptionException alreadySuspended(Long restaurantId) {
        return new SubscriptionException(
            ErrorType.ALREADY_SUSPENDED,
            "Subscription is already suspended for restaurant ID: " + restaurantId,
            restaurantId
        );
    }
    
    public static SubscriptionException notSuspended(Long restaurantId) {
        return new SubscriptionException(
            ErrorType.NOT_SUSPENDED,
            "Subscription is not currently suspended for restaurant ID: " + restaurantId,
            restaurantId
        );
    }
    
    public static SubscriptionException invalidParameters(String message) {
        return new SubscriptionException(ErrorType.INVALID_PARAMETERS, message);
    }
    
    public static SubscriptionException invalidStateTransition(String message, Long restaurantId) {
        return new SubscriptionException(
            ErrorType.INVALID_STATE_TRANSITION,
            message,
            restaurantId
        );
    }
    
    public static SubscriptionException systemError(String message, Throwable cause) {
        return new SubscriptionException(ErrorType.SYSTEM_ERROR, message, cause);
    }

    public static SubscriptionException trialDisabled() {
        return new SubscriptionException(ErrorType.INVALID_PARAMETERS, "Trial is currently disabled");
    }

    public static SubscriptionException trialAlreadyUsed(Long restaurantId) {
        return new SubscriptionException(
            ErrorType.INVALID_STATE_TRANSITION,
            "Trial has already been used for restaurant ID: " + restaurantId,
            restaurantId
        );
    }

    public static SubscriptionException cannotStartTrialWhileSuspended(Long restaurantId) {
        return new SubscriptionException(
            ErrorType.INVALID_STATE_TRANSITION,
            "Cannot start trial while subscription is suspended for restaurant ID: " + restaurantId,
            restaurantId
        );
    }
}
