package com.menux.menu_x_backend.exception;

/**
 * Exception thrown when AI service operations fail
 */
public class AIServiceException extends RuntimeException {
    
    private final String errorCode;
    private final boolean isUserFriendly;

    public AIServiceException(String message) {
        super(message);
        this.errorCode = "AI_SERVICE_ERROR";
        this.isUserFriendly = true;
    }

    public AIServiceException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
        this.isUserFriendly = true;
    }

    public AIServiceException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "AI_SERVICE_ERROR";
        this.isUserFriendly = true;
    }

    public AIServiceException(String message, String errorCode, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.isUserFriendly = true;
    }

    public AIServiceException(String message, String errorCode, boolean isUserFriendly) {
        super(message);
        this.errorCode = errorCode;
        this.isUserFriendly = isUserFriendly;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public boolean isUserFriendly() {
        return isUserFriendly;
    }
}
