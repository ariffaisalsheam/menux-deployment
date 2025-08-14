package com.menux.menu_x_backend.dto.auth;

import com.menux.menu_x_backend.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

// Custom validation annotation for restaurant fields
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = RestaurantFieldsValidator.class)
@Documented
@interface ValidRestaurantFields {
    String message() default "Restaurant name and address are required for restaurant owners";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

// Validator implementation
class RestaurantFieldsValidator implements ConstraintValidator<ValidRestaurantFields, RegisterRequest> {
    @Override
    public boolean isValid(RegisterRequest request, ConstraintValidatorContext context) {
        if (request.getRole() == User.Role.RESTAURANT_OWNER) {
            boolean isValid = true;

            if (request.getRestaurantName() == null || request.getRestaurantName().trim().isEmpty()) {
                context.disableDefaultConstraintViolation();
                context.buildConstraintViolationWithTemplate("Restaurant name is required for restaurant owners")
                       .addPropertyNode("restaurantName")
                       .addConstraintViolation();
                isValid = false;
            }

            if (request.getRestaurantAddress() == null || request.getRestaurantAddress().trim().isEmpty()) {
                context.disableDefaultConstraintViolation();
                context.buildConstraintViolationWithTemplate("Restaurant address is required for restaurant owners")
                       .addPropertyNode("restaurantAddress")
                       .addConstraintViolation();
                isValid = false;
            }

            return isValid;
        }
        return true; // Valid for non-restaurant owners
    }
}

@ValidRestaurantFields
public class RegisterRequest {
    
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    
    @NotBlank(message = "Full name is required")
    private String fullName;
    
    private String phoneNumber;
    
    @NotNull(message = "Role is required")
    private User.Role role;
    
    // Restaurant details (required if role is RESTAURANT_OWNER)
    private String restaurantName;
    private String restaurantAddress;
    private String restaurantDescription;
    private String restaurantPhone;
    private String restaurantEmail;
    
    // Constructors
    public RegisterRequest() {}
    
    // Getters and Setters
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    
    public User.Role getRole() { return role; }
    public void setRole(User.Role role) { this.role = role; }
    
    public String getRestaurantName() { return restaurantName; }
    public void setRestaurantName(String restaurantName) { this.restaurantName = restaurantName; }
    
    public String getRestaurantAddress() { return restaurantAddress; }
    public void setRestaurantAddress(String restaurantAddress) { this.restaurantAddress = restaurantAddress; }
    
    public String getRestaurantDescription() { return restaurantDescription; }
    public void setRestaurantDescription(String restaurantDescription) { this.restaurantDescription = restaurantDescription; }
    
    public String getRestaurantPhone() { return restaurantPhone; }
    public void setRestaurantPhone(String restaurantPhone) { this.restaurantPhone = restaurantPhone; }
    
    public String getRestaurantEmail() { return restaurantEmail; }
    public void setRestaurantEmail(String restaurantEmail) { this.restaurantEmail = restaurantEmail; }
}
