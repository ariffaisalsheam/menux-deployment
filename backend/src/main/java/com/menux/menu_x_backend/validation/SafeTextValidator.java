package com.menux.menu_x_backend.validation;

import com.menux.menu_x_backend.util.InputSanitizer;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.beans.factory.annotation.Autowired;

public class SafeTextValidator implements ConstraintValidator<SafeText, String> {

    @Autowired
    private InputSanitizer inputSanitizer;
    
    private int maxLength;
    private boolean allowHTML;

    @Override
    public void initialize(SafeText constraintAnnotation) {
        this.maxLength = constraintAnnotation.maxLength();
        this.allowHTML = constraintAnnotation.allowHTML();
    }

    @Override
    public boolean isValid(String text, ConstraintValidatorContext context) {
        if (text == null || text.trim().isEmpty()) {
            return true; // Null/empty is valid, use @NotBlank for required fields
        }
        
        if (inputSanitizer == null) {
            return true; // Fail safe if sanitizer not available
        }
        
        // Check length
        if (text.length() > maxLength) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Text exceeds maximum length of " + maxLength + " characters")
                .addConstraintViolation();
            return false;
        }
        
        // Check for SQL injection
        if (inputSanitizer.containsSQLInjection(text)) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Text contains potentially unsafe SQL content")
                .addConstraintViolation();
            return false;
        }
        
        // Check for XSS if HTML not allowed
        if (!allowHTML && inputSanitizer.containsXSS(text)) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Text contains potentially unsafe script content")
                .addConstraintViolation();
            return false;
        }
        
        return true;
    }
}
