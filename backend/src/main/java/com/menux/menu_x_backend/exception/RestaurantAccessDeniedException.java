package com.menux.menu_x_backend.exception;

/**
 * Exception thrown when user tries to access a restaurant they don't own
 */
public class RestaurantAccessDeniedException extends RuntimeException {
    
    public RestaurantAccessDeniedException(String message) {
        super(message);
    }
    
    public RestaurantAccessDeniedException(String message, Throwable cause) {
        super(message, cause);
    }
    
    public RestaurantAccessDeniedException(Long userId, Long restaurantId) {
        super("User " + userId + " does not have access to restaurant " + restaurantId);
    }
}
