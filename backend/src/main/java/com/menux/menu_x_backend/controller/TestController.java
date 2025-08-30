package com.menux.menu_x_backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.menux.menu_x_backend.entity.AIProviderConfig;
import com.menux.menu_x_backend.repository.AIProviderConfigRepository;
import com.menux.menu_x_backend.service.AIProviderService;

@RestController
@RequestMapping("/api/test")
public class TestController {

    private static final Logger logger = LoggerFactory.getLogger(TestController.class);

    @Autowired
    private AIProviderService aiProviderService;

    @Autowired
    private AIProviderConfigRepository aiProviderConfigRepository;


    @GetMapping("/health")
    public Map<String, String> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Menu.X Backend is running!");
        return response;
    }

    @GetMapping("/ai-providers")
    public ResponseEntity<Map<String, Object>> listAIProviders() {
        try {
            List<AIProviderConfig> allProviders = aiProviderConfigRepository.findAll();
            List<AIProviderConfig> activeProviders = aiProviderConfigRepository.findActiveProvidersOrderedByPriority();

            Map<String, Object> response = new HashMap<>();
            response.put("totalProviders", allProviders.size());
            response.put("activeProviders", activeProviders.size());
            response.put("providers", allProviders.stream().map(p -> {
                Map<String, Object> providerInfo = new HashMap<>();
                providerInfo.put("id", p.getId());
                providerInfo.put("name", p.getName());
                providerInfo.put("type", p.getType());
                providerInfo.put("model", p.getModel());
                providerInfo.put("endpoint", p.getEndpoint());
                providerInfo.put("isActive", p.getIsActive());
                providerInfo.put("isPrimary", p.getIsPrimary());
                return providerInfo;
            }).toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error listing AI providers", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/ai-test")
    public ResponseEntity<Map<String, Object>> testAI(@RequestBody Map<String, String> body) {
        try {
            String prompt = body.getOrDefault("prompt", "Chicken Biryani");

            logger.info("Testing AI with prompt: {}", prompt);
            String result = aiProviderService.generateMenuDescription(prompt);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "prompt", prompt,
                "result", result
            ));
        } catch (Exception e) {
            logger.error("Error testing AI", e);
            return ResponseEntity.ok(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
}
