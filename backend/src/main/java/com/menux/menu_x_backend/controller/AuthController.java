package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.dto.auth.AuthResponse;
import com.menux.menu_x_backend.dto.auth.LoginRequest;
import com.menux.menu_x_backend.dto.auth.RegisterRequest;
import com.menux.menu_x_backend.service.AuthService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            logger.info("Registration request received for username: {}, email: {}, role: {}, restaurant: {}",
                request.getUsername(), request.getEmail(), request.getRole(), request.getRestaurantName());

            AuthResponse response = authService.register(request);
            logger.info("User registration successful for username: {}", request.getUsername());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            logger.error("Registration failed for username: {}, error: {}", request.getUsername(), e.getMessage());
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            logger.debug("Login attempt for username: {}", request.getUsername());
            AuthResponse response = authService.login(request);
            logger.info("Login successful for username: {}", request.getUsername());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            logger.warn("Login failed for username: {}, error: {}", request.getUsername(), e.getMessage());
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Invalid username or password"));
        }
    }

    // Helper class for error messages
    public static class MessageResponse {
        private String message;

        public MessageResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
