package com.menux.menu_x_backend.util;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class InputSanitizer {

    // Pattern to detect potentially malicious scripts
    private static final Pattern SCRIPT_PATTERN = Pattern.compile(
        "<script[^>]*>.*?</script>|javascript:|on\\w+\\s*=|<iframe|<object|<embed",
        Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );

    // Pattern for HTML tags
    private static final Pattern HTML_PATTERN = Pattern.compile("<[^>]+>");

    // Pattern for SQL injection attempts
    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
        "('|(\\-\\-)|(;)|(\\|)|(\\*)|(%)|(union)|(select)|(insert)|(delete)|(update)|(drop)|(create)|(alter)|(exec)|(execute))",
        Pattern.CASE_INSENSITIVE
    );

    /**
     * Sanitize input by removing potentially dangerous content
     */
    public String sanitizeInput(String input) {
        if (input == null || input.trim().isEmpty()) {
            return input;
        }

        String sanitized = input.trim();

        // Remove script tags and javascript
        sanitized = SCRIPT_PATTERN.matcher(sanitized).replaceAll("");

        // Remove HTML tags (basic protection)
        sanitized = HTML_PATTERN.matcher(sanitized).replaceAll("");

        // Escape special characters
        sanitized = sanitized
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#x27;")
            .replace("/", "&#x2F;");

        return sanitized;
    }

    /**
     * Sanitize feedback comment (allows basic formatting)
     */
    public String sanitizeFeedbackComment(String comment) {
        if (comment == null || comment.trim().isEmpty()) {
            return comment;
        }

        String sanitized = comment.trim();

        // Remove dangerous scripts but allow basic text formatting
        sanitized = SCRIPT_PATTERN.matcher(sanitized).replaceAll("");

        // Remove potentially dangerous SQL injection patterns
        sanitized = SQL_INJECTION_PATTERN.matcher(sanitized).replaceAll("");

        // Limit length to prevent abuse
        if (sanitized.length() > 1000) {
            sanitized = sanitized.substring(0, 1000);
        }

        return sanitized;
    }

    /**
     * Validate email format
     */
    public boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return true; // Optional field
        }

        String emailRegex = "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$";
        Pattern pattern = Pattern.compile(emailRegex);
        return pattern.matcher(email).matches();
    }

    /**
     * Validate phone number format
     */
    public boolean isValidPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return true; // Optional field
        }

        // Bangladesh phone number format: +880xxxxxxxxx or 01xxxxxxxxx
        String phoneRegex = "^(\\+880|880|0)?1[3-9]\\d{8}$";
        Pattern pattern = Pattern.compile(phoneRegex);
        return pattern.matcher(phoneNumber.replaceAll("[\\s-]", "")).matches();
    }

    /**
     * Sanitize restaurant name
     */
    public String sanitizeRestaurantName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return name;
        }

        String sanitized = name.trim();
        
        // Remove scripts and HTML
        sanitized = SCRIPT_PATTERN.matcher(sanitized).replaceAll("");
        sanitized = HTML_PATTERN.matcher(sanitized).replaceAll("");
        
        // Allow only alphanumeric, spaces, and common restaurant name characters
        sanitized = sanitized.replaceAll("[^a-zA-Z0-9\\s\\-&'.,()]", "");
        
        // Limit length
        if (sanitized.length() > 100) {
            sanitized = sanitized.substring(0, 100);
        }
        
        return sanitized;
    }

    /**
     * Validate and sanitize order number
     */
    public String sanitizeOrderNumber(String orderNumber) {
        if (orderNumber == null || orderNumber.trim().isEmpty()) {
            return orderNumber;
        }

        String sanitized = orderNumber.trim();
        
        // Allow only alphanumeric and hyphens for order numbers
        sanitized = sanitized.replaceAll("[^a-zA-Z0-9\\-]", "");
        
        // Do not truncate order numbers; backend generates long IDs like "ORD-<timestamp>-<UUID8>"
        // Keeping full value prevents 404s during public tracking.
        // If you need to enforce a maximum in the future, ensure it accommodates the generator format.
        
        return sanitized;
    }

    /**
     * Validate file upload
     */
    public boolean isValidFileUpload(String fileName, long fileSize, String contentType) {
        if (fileName == null || fileName.trim().isEmpty()) {
            return false;
        }

        // Check file size (max 10MB)
        if (fileSize > 10 * 1024 * 1024) {
            return false;
        }

        // Check allowed file extensions
        String[] allowedExtensions = {".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx"};
        String lowerFileName = fileName.toLowerCase();
        boolean hasValidExtension = false;
        for (String ext : allowedExtensions) {
            if (lowerFileName.endsWith(ext)) {
                hasValidExtension = true;
                break;
            }
        }

        if (!hasValidExtension) {
            return false;
        }

        // Check content type
        String[] allowedContentTypes = {
            "image/jpeg", "image/png", "image/gif",
            "application/pdf", "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        };

        if (contentType != null) {
            for (String allowedType : allowedContentTypes) {
                if (contentType.equals(allowedType)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Sanitize menu item name
     */
    public String sanitizeMenuItemName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return name;
        }

        String sanitized = name.trim();

        // Remove scripts and HTML
        sanitized = SCRIPT_PATTERN.matcher(sanitized).replaceAll("");
        sanitized = HTML_PATTERN.matcher(sanitized).replaceAll("");

        // Allow alphanumeric, spaces, and common food name characters
        sanitized = sanitized.replaceAll("[^a-zA-Z0-9\\s\\-&'.,()\\u0980-\\u09FF]", "");

        // Limit length
        if (sanitized.length() > 100) {
            sanitized = sanitized.substring(0, 100);
        }

        return sanitized;
    }

    /**
     * Validate price input
     */
    public boolean isValidPrice(String priceStr) {
        if (priceStr == null || priceStr.trim().isEmpty()) {
            return false;
        }

        try {
            double price = Double.parseDouble(priceStr);
            return price >= 0 && price <= 999999.99;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    /**
     * Sanitize address input
     */
    public String sanitizeAddress(String address) {
        if (address == null || address.trim().isEmpty()) {
            return address;
        }

        String sanitized = address.trim();

        // Remove scripts and HTML
        sanitized = SCRIPT_PATTERN.matcher(sanitized).replaceAll("");
        sanitized = HTML_PATTERN.matcher(sanitized).replaceAll("");

        // Allow alphanumeric, spaces, and common address characters including Bengali
        sanitized = sanitized.replaceAll("[^a-zA-Z0-9\\s\\-#.,/()\\u0980-\\u09FF]", "");

        // Limit length
        if (sanitized.length() > 500) {
            sanitized = sanitized.substring(0, 500);
        }

        return sanitized;
    }

    /**
     * Check for potential SQL injection
     */
    public boolean containsSQLInjection(String input) {
        if (input == null || input.trim().isEmpty()) {
            return false;
        }

        return SQL_INJECTION_PATTERN.matcher(input.toLowerCase()).find();
    }

    /**
     * Check for potential XSS
     */
    public boolean containsXSS(String input) {
        if (input == null || input.trim().isEmpty()) {
            return false;
        }

        return SCRIPT_PATTERN.matcher(input.toLowerCase()).find();
    }

    /**
     * Validate username format
     */
    public boolean isValidUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            return false;
        }

        // Username: 3-50 characters, alphanumeric and underscore only
        String usernameRegex = "^[a-zA-Z0-9_]{3,50}$";
        Pattern pattern = Pattern.compile(usernameRegex);
        return pattern.matcher(username).matches();
    }

    /**
     * Validate password strength
     */
    public boolean isValidPassword(String password) {
        if (password == null || password.length() < 6) {
            return false;
        }

        // Password must be at least 6 characters
        // Should contain at least one letter and one number for better security
        return password.length() >= 6 && password.length() <= 128;
    }

    /**
     * Sanitize general text input
     */
    public String sanitizeText(String text, int maxLength) {
        if (text == null || text.trim().isEmpty()) {
            return text;
        }

        String sanitized = text.trim();

        // Remove scripts and HTML
        sanitized = SCRIPT_PATTERN.matcher(sanitized).replaceAll("");
        sanitized = HTML_PATTERN.matcher(sanitized).replaceAll("");

        // Remove potential SQL injection patterns
        if (containsSQLInjection(sanitized)) {
            sanitized = SQL_INJECTION_PATTERN.matcher(sanitized).replaceAll("");
        }

        // Limit length
        if (sanitized.length() > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }

        return sanitized;
    }
}
