package com.menux.menu_x_backend.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.orm.jpa.JpaSystemException;
import org.springframework.transaction.TransactionSystemException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.servlet.NoHandlerFoundException;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolationException;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Generate unique error ID for tracking
    private String generateErrorId() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ErrorResponse errorResponse = new ErrorResponse(
                "Validation failed",
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now(),
                errors
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(
            BadCredentialsException ex, WebRequest request) {
        ErrorResponse errorResponse = new ErrorResponse(
                "Invalid username or password",
                HttpStatus.UNAUTHORIZED.value(),
                LocalDateTime.now(),
                null
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(
            RuntimeException ex, WebRequest request) {
        ErrorResponse errorResponse = new ErrorResponse(
                ex.getMessage(),
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now(),
                null
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(RestaurantNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleRestaurantNotFound(
            RestaurantNotFoundException ex, WebRequest request) {
        logger.warn("Restaurant not found: {}", ex.getMessage());
        ErrorResponse errorResponse = new ErrorResponse(
                ex.getMessage(),
                HttpStatus.NOT_FOUND.value(),
                LocalDateTime.now(),
                null
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(RestaurantAccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleRestaurantAccessDenied(
            RestaurantAccessDeniedException ex, WebRequest request) {
        String errorId = generateErrorId();
        logger.warn("Restaurant access denied [{}]: {}", errorId, ex.getMessage());

        ErrorResponse errorResponse = new ErrorResponse(
                ex.getMessage(),
                HttpStatus.FORBIDDEN.value(),
                LocalDateTime.now(),
                Map.of("errorId", errorId)
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }

    // Custom business logic exceptions
    @ExceptionHandler(BusinessLogicException.class)
    public ResponseEntity<ErrorResponse> handleBusinessLogic(
            BusinessLogicException ex, WebRequest request) {
        String errorId = generateErrorId();
        logger.warn("Business logic violation [{}]: {}", errorId, ex.getMessage());

        Map<String, String> errorDetails = new HashMap<>();
        errorDetails.put("errorId", errorId);
        errorDetails.put("errorCode", ex.getErrorCode());

        ErrorResponse errorResponse = new ErrorResponse(
                ex.getMessage(),
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now(),
                errorDetails
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    // External service exceptions
    @ExceptionHandler(ExternalServiceException.class)
    public ResponseEntity<ErrorResponse> handleExternalService(
            ExternalServiceException ex, WebRequest request) {
        String errorId = generateErrorId();
        logger.error("External service error [{}] for service {}: {}", errorId, ex.getServiceName(), ex.getMessage(), ex);

        Map<String, String> errorDetails = new HashMap<>();
        errorDetails.put("errorId", errorId);
        errorDetails.put("serviceName", ex.getServiceName());
        errorDetails.put("errorCode", ex.getErrorCode());
        errorDetails.put("retryable", String.valueOf(ex.isRetryable()));

        String userMessage = ex.isRetryable()
            ? "External service temporarily unavailable. Please try again later"
            : "External service error. Please contact support";

        ErrorResponse errorResponse = new ErrorResponse(
                userMessage,
                HttpStatus.SERVICE_UNAVAILABLE.value(),
                LocalDateTime.now(),
                errorDetails
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.SERVICE_UNAVAILABLE);
    }

    // Custom validation exceptions
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleCustomValidation(
            ValidationException ex, WebRequest request) {
        String errorId = generateErrorId();
        logger.warn("Custom validation error [{}]: {}", errorId, ex.getMessage());

        Map<String, String> errors = new HashMap<>();
        errors.put("errorId", errorId);

        if (ex.hasFieldErrors()) {
            errors.putAll(ex.getFieldErrors());
        }

        ErrorResponse errorResponse = new ErrorResponse(
                ex.getMessage(),
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now(),
                errors
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException ex, WebRequest request) {
        String errorId = generateErrorId();
        logger.warn("Access denied [{}]: {}", errorId, ex.getMessage());

        ErrorResponse errorResponse = new ErrorResponse(
                "Access denied. You do not have permission to perform this action",
                HttpStatus.FORBIDDEN.value(),
                LocalDateTime.now(),
                Map.of("errorId", errorId)
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }

    // Authentication exceptions
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(
            AuthenticationException ex, WebRequest request) {
        String errorId = generateErrorId();
        logger.warn("Authentication failed [{}]: {}", errorId, ex.getMessage());

        ErrorResponse errorResponse = new ErrorResponse(
                "Authentication failed. Please check your credentials",
                HttpStatus.UNAUTHORIZED.value(),
                LocalDateTime.now(),
                Map.of("errorId", errorId)
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }

    // HTTP message not readable (malformed JSON)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, WebRequest request) {
        String errorId = generateErrorId();
        logger.warn("Malformed request body [{}]: {}", errorId, ex.getMessage());

        ErrorResponse errorResponse = new ErrorResponse(
                "Invalid request format. Please check your request body",
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now(),
                Map.of("errorId", errorId)
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    // Missing request parameters
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParameter(
            MissingServletRequestParameterException ex, WebRequest request) {
        String errorId = generateErrorId();
        logger.warn("Missing request parameter [{}]: {}", errorId, ex.getMessage());

        ErrorResponse errorResponse = new ErrorResponse(
                "Missing required parameter: " + ex.getParameterName(),
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now(),
                Map.of("errorId", errorId, "parameter", ex.getParameterName())
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    // Method argument type mismatch
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, WebRequest request) {
        String errorId = generateErrorId();
        logger.warn("Type mismatch [{}]: {}", errorId, ex.getMessage());

        String message = String.format("Invalid value for parameter '%s'. Expected %s",
                ex.getName(), ex.getRequiredType().getSimpleName());

        ErrorResponse errorResponse = new ErrorResponse(
                message,
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now(),
                Map.of("errorId", errorId, "parameter", ex.getName())
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    // HTTP method not supported
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException ex, WebRequest request) {
        String errorId = generateErrorId();
        logger.warn("Method not supported [{}]: {}", errorId, ex.getMessage());

        ErrorResponse errorResponse = new ErrorResponse(
                "HTTP method not supported: " + ex.getMethod(),
                HttpStatus.METHOD_NOT_ALLOWED.value(),
                LocalDateTime.now(),
                Map.of("errorId", errorId, "method", ex.getMethod())
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.METHOD_NOT_ALLOWED);
    }

    // No handler found (404)
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoHandlerFound(
            NoHandlerFoundException ex, WebRequest request) {
        String errorId = generateErrorId();
        logger.warn("No handler found [{}]: {}", errorId, ex.getMessage());

        ErrorResponse errorResponse = new ErrorResponse(
                "Endpoint not found: " + ex.getRequestURL(),
                HttpStatus.NOT_FOUND.value(),
                LocalDateTime.now(),
                Map.of("errorId", errorId, "url", ex.getRequestURL())
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    // File upload size exceeded
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceeded(
            MaxUploadSizeExceededException ex, WebRequest request) {
        String errorId = generateErrorId();
        logger.warn("File upload size exceeded [{}]: {}", errorId, ex.getMessage());

        ErrorResponse errorResponse = new ErrorResponse(
                "File size exceeds maximum allowed limit",
                HttpStatus.PAYLOAD_TOO_LARGE.value(),
                LocalDateTime.now(),
                Map.of("errorId", errorId)
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.PAYLOAD_TOO_LARGE);
    }

    // Network connectivity issues
    @ExceptionHandler({ConnectException.class, SocketTimeoutException.class})
    public ResponseEntity<ErrorResponse> handleNetworkException(
            Exception ex, WebRequest request) {
        String errorId = generateErrorId();
        logger.error("Network connectivity issue [{}]: {}", errorId, ex.getMessage(), ex);

        ErrorResponse errorResponse = new ErrorResponse(
                "External service temporarily unavailable. Please try again later",
                HttpStatus.SERVICE_UNAVAILABLE.value(),
                LocalDateTime.now(),
                Map.of("errorId", errorId)
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.SERVICE_UNAVAILABLE);
    }

    @ExceptionHandler({DataAccessException.class, JpaSystemException.class})
    public ResponseEntity<ErrorResponse> handleDatabaseException(
            Exception ex, WebRequest request) {
        logger.error("Database error occurred", ex);
        ErrorResponse errorResponse = new ErrorResponse(
                "A database error occurred. Please try again later.",
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                LocalDateTime.now(),
                null
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Database constraint violations
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(
            DataIntegrityViolationException ex, WebRequest request) {
        String errorId = generateErrorId();
        logger.error("Data integrity violation [{}]: {}", errorId, ex.getMessage(), ex);

        String userMessage = "The operation could not be completed due to data constraints";
        if (ex.getMessage() != null) {
            if (ex.getMessage().contains("unique") || ex.getMessage().contains("duplicate")) {
                userMessage = "This record already exists";
            } else if (ex.getMessage().contains("foreign key")) {
                userMessage = "Cannot delete this record as it is referenced by other data";
            }
        }

        ErrorResponse errorResponse = new ErrorResponse(
                userMessage,
                HttpStatus.CONFLICT.value(),
                LocalDateTime.now(),
                Map.of("errorId", errorId)
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    // Duplicate key violations
    @ExceptionHandler(DuplicateKeyException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateKey(
            DuplicateKeyException ex, WebRequest request) {
        String errorId = generateErrorId();
        logger.warn("Duplicate key violation [{}]: {}", errorId, ex.getMessage());

        ErrorResponse errorResponse = new ErrorResponse(
                "This record already exists",
                HttpStatus.CONFLICT.value(),
                LocalDateTime.now(),
                Map.of("errorId", errorId)
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    // Entity not found
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFound(
            EntityNotFoundException ex, WebRequest request) {
        String errorId = generateErrorId();
        logger.warn("Entity not found [{}]: {}", errorId, ex.getMessage());

        ErrorResponse errorResponse = new ErrorResponse(
                "The requested resource was not found",
                HttpStatus.NOT_FOUND.value(),
                LocalDateTime.now(),
                Map.of("errorId", errorId)
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    // Constraint violations
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex, WebRequest request) {
        String errorId = generateErrorId();
        logger.warn("Constraint violation [{}]: {}", errorId, ex.getMessage());

        Map<String, String> errors = new HashMap<>();
        ex.getConstraintViolations().forEach(violation -> {
            String fieldName = violation.getPropertyPath().toString();
            String errorMessage = violation.getMessage();
            errors.put(fieldName, errorMessage);
        });

        ErrorResponse errorResponse = new ErrorResponse(
                "Validation constraints violated",
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now(),
                errors
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    // Transaction system exceptions
    @ExceptionHandler(TransactionSystemException.class)
    public ResponseEntity<ErrorResponse> handleTransactionSystem(
            TransactionSystemException ex, WebRequest request) {
        String errorId = generateErrorId();
        logger.error("Transaction system error [{}]: {}", errorId, ex.getMessage(), ex);

        ErrorResponse errorResponse = new ErrorResponse(
                "Transaction failed. Please try again",
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                LocalDateTime.now(),
                Map.of("errorId", errorId)
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // SQL exceptions
    @ExceptionHandler(SQLException.class)
    public ResponseEntity<ErrorResponse> handleSQLException(
            SQLException ex, WebRequest request) {
        String errorId = generateErrorId();
        logger.error("SQL error [{}]: {}", errorId, ex.getMessage(), ex);

        ErrorResponse errorResponse = new ErrorResponse(
                "Database operation failed. Please try again later",
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                LocalDateTime.now(),
                Map.of("errorId", errorId)
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
            Exception ex, WebRequest request) {
        String errorId = generateErrorId();
        logger.error("Unexpected error occurred [{}]: {}", errorId, ex.getMessage(), ex);

        ErrorResponse errorResponse = new ErrorResponse(
                "An unexpected error occurred",
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                LocalDateTime.now(),
                Map.of("errorId", errorId)
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Enhanced Error response class
    public static class ErrorResponse {
        private String message;
        private int status;
        private LocalDateTime timestamp;
        private Map<String, String> errors;
        private String path;
        private String method;

        public ErrorResponse(String message, int status, LocalDateTime timestamp, Map<String, String> errors) {
            this.message = message;
            this.status = status;
            this.timestamp = timestamp;
            this.errors = errors;
        }

        public ErrorResponse(String message, int status, LocalDateTime timestamp, Map<String, String> errors,
                           String path, String method) {
            this.message = message;
            this.status = status;
            this.timestamp = timestamp;
            this.errors = errors;
            this.path = path;
            this.method = method;
        }

        // Getters and setters
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public int getStatus() { return status; }
        public void setStatus(int status) { this.status = status; }

        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

        public Map<String, String> getErrors() { return errors; }
        public void setErrors(Map<String, String> errors) { this.errors = errors; }

        public String getPath() { return path; }
        public void setPath(String path) { this.path = path; }

        public String getMethod() { return method; }
        public void setMethod(String method) { this.method = method; }
    }
}
