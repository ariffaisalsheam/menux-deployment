package com.menux.menu_x_backend.exception;

/**
 * Exception for external service failures (AI APIs, payment gateways, etc.)
 */
public class ExternalServiceException extends RuntimeException {
    
    private final String serviceName;
    private final String errorCode;
    private final boolean retryable;
    
    public ExternalServiceException(String serviceName, String message) {
        super(message);
        this.serviceName = serviceName;
        this.errorCode = "EXTERNAL_SERVICE_ERROR";
        this.retryable = true;
    }
    
    public ExternalServiceException(String serviceName, String message, String errorCode) {
        super(message);
        this.serviceName = serviceName;
        this.errorCode = errorCode;
        this.retryable = true;
    }
    
    public ExternalServiceException(String serviceName, String message, boolean retryable) {
        super(message);
        this.serviceName = serviceName;
        this.errorCode = "EXTERNAL_SERVICE_ERROR";
        this.retryable = retryable;
    }
    
    public ExternalServiceException(String serviceName, String message, String errorCode, boolean retryable) {
        super(message);
        this.serviceName = serviceName;
        this.errorCode = errorCode;
        this.retryable = retryable;
    }
    
    public ExternalServiceException(String serviceName, String message, Throwable cause) {
        super(message, cause);
        this.serviceName = serviceName;
        this.errorCode = "EXTERNAL_SERVICE_ERROR";
        this.retryable = true;
    }
    
    public ExternalServiceException(String serviceName, String message, String errorCode, Throwable cause, boolean retryable) {
        super(message, cause);
        this.serviceName = serviceName;
        this.errorCode = errorCode;
        this.retryable = retryable;
    }
    
    public String getServiceName() {
        return serviceName;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
    
    public boolean isRetryable() {
        return retryable;
    }
}
