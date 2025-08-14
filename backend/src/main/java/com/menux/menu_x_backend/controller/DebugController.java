package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.dto.auth.RegisterRequest;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @PostMapping("/test-register")
    public Map<String, Object> testRegister(@RequestBody RegisterRequest request) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "received");
        response.put("username", request.getUsername());
        response.put("email", request.getEmail());
        response.put("role", request.getRole());
        response.put("restaurantName", request.getRestaurantName());
        return response;
    }

    @PostMapping("/simple-test")
    public Map<String, String> simpleTest(@RequestBody Map<String, Object> data) {
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("received", data.toString());
        return response;
    }

    @GetMapping("/ping")
    public Map<String, String> ping() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "pong");
        response.put("timestamp", String.valueOf(System.currentTimeMillis()));
        return response;
    }
}
