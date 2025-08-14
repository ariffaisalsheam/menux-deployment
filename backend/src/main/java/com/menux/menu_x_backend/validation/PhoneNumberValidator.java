package com.menux.menu_x_backend.validation;

import com.menux.menu_x_backend.util.InputSanitizer;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.beans.factory.annotation.Autowired;

public class PhoneNumberValidator implements ConstraintValidator<ValidPhoneNumber, String> {

    @Autowired
    private InputSanitizer inputSanitizer;
    
    private boolean required;

    @Override
    public void initialize(ValidPhoneNumber constraintAnnotation) {
        this.required = constraintAnnotation.required();
    }

    @Override
    public boolean isValid(String phoneNumber, ConstraintValidatorContext context) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return !required; // Valid if not required, invalid if required
        }
        
        return inputSanitizer != null ? inputSanitizer.isValidPhoneNumber(phoneNumber) : true;
    }
}
