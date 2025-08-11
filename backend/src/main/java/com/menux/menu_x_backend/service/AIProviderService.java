package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.entity.AIProviderConfig;
import com.menux.menu_x_backend.repository.AIProviderConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AIProviderService {

    @Autowired
    private AIProviderConfigRepository repository;

    @Autowired
    private EncryptionService encryptionService;

    public String generateMenuDescription(String itemName) {
        // For now, return a deterministic placeholder if no providers are configured
        List<AIProviderConfig> providers = repository.findActiveProvidersOrderedByPriority();
        if (providers.isEmpty()) {
            return "A delicious " + itemName + " crafted with fresh ingredients and served with care.";
        }
        // In a real implementation, call external provider(s). Keeping placeholder for MVP.
        return "Chef's special " + itemName + " featuring balanced flavors and irresistible aroma.";
    }

    public String analyzeFeedback(String feedback) {
        List<AIProviderConfig> providers = repository.findActiveProvidersOrderedByPriority();
        if (providers.isEmpty()) {
            return "Sentiment: Neutral. Key points: Service quality acceptable; flavors could be improved.";
        }
        return "Sentiment: Positive. Key points: Friendly staff, tasty dishes, great ambiance.";
    }
}
