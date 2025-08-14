package com.menux.menu_x_backend.exception;

/**
 * Exception thrown when a restaurant is not found or user doesn't have an associated restaurant
 */
public class RestaurantNotFoundException extends RuntimeException {
    
    public RestaurantNotFoundException(String message) {
        super(message);
    }
    
    public RestaurantNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
    
    public RestaurantNotFoundException(Long userId) {
        super("No restaurant found for user ID: " + userId);
    }
}
