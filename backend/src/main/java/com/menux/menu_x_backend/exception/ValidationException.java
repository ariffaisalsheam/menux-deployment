package com.menux.menu_x_backend.exception;

import java.util.Map;

/**
 * Exception for custom validation errors
 */
public class ValidationException extends RuntimeException {
    
    private final Map<String, String> fieldErrors;
    
    public ValidationException(String message) {
        super(message);
        this.fieldErrors = null;
    }
    
    public ValidationException(String message, Map<String, String> fieldErrors) {
        super(message);
        this.fieldErrors = fieldErrors;
    }
    
    public ValidationException(String message, Throwable cause) {
        super(message, cause);
        this.fieldErrors = null;
    }
    
    public ValidationException(String message, Map<String, String> fieldErrors, Throwable cause) {
        super(message, cause);
        this.fieldErrors = fieldErrors;
    }
    
    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
    
    public boolean hasFieldErrors() {
        return fieldErrors != null && !fieldErrors.isEmpty();
    }
}
