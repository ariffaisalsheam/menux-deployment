package com.menux.menu_x_backend.dto.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public class UpdateUserRequest {
    
    @Email(message = "Email should be valid")
    private String email;
    
    @Size(min = 1, message = "Full name cannot be empty")
    private String fullName;
    
    private String phoneNumber;
    
    private Boolean isActive;

    // Constructors
    public UpdateUserRequest() {}

    // Getters and Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
