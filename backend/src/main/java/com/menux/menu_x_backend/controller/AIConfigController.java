package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.dto.ai.*;
import com.menux.menu_x_backend.service.AIConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/ai-config")
public class AIConfigController {

    @Autowired
    private AIConfigService aiConfigService;

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

    @PostMapping("/{id}/set-primary")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<AIProviderConfigDTO> setPrimary(@PathVariable Long id) {
        return ResponseEntity.ok(aiConfigService.setPrimaryProvider(id));
    }
}
