package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.dto.ai.*;
import com.menux.menu_x_backend.service.AIConfigService;
import com.menux.menu_x_backend.service.AIUsageService;
import com.menux.menu_x_backend.service.ExternalApiResilienceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/ai-config")
public class AIConfigController {

    @Autowired
    private AIConfigService aiConfigService;

    @Autowired
    private AIUsageService aiUsageService;

    @Autowired
    private ExternalApiResilienceService resilienceService;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<AIProviderConfigDTO>> getAllProviders() {
        return ResponseEntity.ok(aiConfigService.getAllProviders());
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','RESTAURANT_OWNER')")
    public ResponseEntity<List<AIProviderConfigDTO>> getActiveProviders() {
        return ResponseEntity.ok(aiConfigService.getActiveProviders());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<AIProviderConfigDTO> getProviderById(@PathVariable Long id) {
        return ResponseEntity.ok(aiConfigService.getProviderById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<AIProviderConfigDTO> createProvider(@Validated @RequestBody CreateAIProviderRequest request) {
        return ResponseEntity.ok(aiConfigService.createProvider(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<AIProviderConfigDTO> updateProvider(@PathVariable Long id,
                                                              @RequestBody UpdateAIProviderRequest request) {
        return ResponseEntity.ok(aiConfigService.updateProvider(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteProvider(@PathVariable Long id) {
        aiConfigService.deleteProvider(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/test")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<AIProviderTestResult> testProvider(@PathVariable Long id) {
        return ResponseEntity.ok(aiConfigService.testProvider(id));
    }

    @PostMapping("/test")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<AIProviderTestResult> testProviderConfiguration(@RequestBody TestProviderRequest request) {
        return ResponseEntity.ok(aiConfigService.testProviderConfiguration(request));
    }

    @PostMapping("/{id}/set-primary")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<AIProviderConfigDTO> setPrimary(@PathVariable Long id) {
        return ResponseEntity.ok(aiConfigService.setPrimaryProvider(id));
    }

    @GetMapping("/models")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, List<String>>> getAvailableModels() {
        return ResponseEntity.ok(aiConfigService.getAvailableModels());
    }

    @GetMapping("/usage")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<Long, AIUsageDTO>> getUsage() {
        return ResponseEntity.ok(aiUsageService.getUsageStatistics());
    }

    @PostMapping("/reset-circuit-breaker/{serviceName}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> resetCircuitBreaker(@PathVariable String serviceName) {
        resilienceService.resetCircuitBreaker(serviceName);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Circuit breaker reset for service: " + serviceName);
        response.put("serviceName", serviceName);

        return ResponseEntity.ok(response);
    }
}
