package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.dto.ai.AIProviderTestResult;
import com.menux.menu_x_backend.entity.AIProviderConfig;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.HashMap;
import java.util.Map;


@Service
public class AIProviderTestService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private ExternalApiResilienceService resilienceService;

    public AIProviderTestResult testProvider(AIProviderConfig.ProviderType type, String apiKey, String endpoint, String settings, String model) {
        try {
            switch (type) {
                case GOOGLE_GEMINI:
                    return testGoogleGemini(apiKey, model);
                case OPENROUTER:
                    return testOpenRouter(apiKey, endpoint, model);
                case OPENAI:
                    return testOpenAI(apiKey, model);
                case OPENAI_COMPATIBLE:
                    return testOpenAICompatible(apiKey, endpoint, model);
                case Z_AI_GLM_4_5:
                    return testZAI(apiKey, endpoint, model);
                default:
                    return AIProviderTestResult.failure("Unsupported provider type: " + type);
            }
        } catch (Exception e) {
            return AIProviderTestResult.failure("Test failed: " + e.getMessage());
        }
    }

    private AIProviderTestResult testGoogleGemini(String apiKey, String model) {
        try {
            String mdl = (model == null || model.isBlank()) ? "gemini-2.5-flash" : model;
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + mdl + ":generateContent?key=" + apiKey;

            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> contents = new HashMap<>();
            Map<String, Object> parts = new HashMap<>();
            parts.put("text", "Hello, this is a test message. Please respond with 'Test successful'.");
            contents.put("parts", new Object[]{parts});
            requestBody.put("contents", new Object[]{contents});

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                if (responseJson.has("candidates")) {
                    return AIProviderTestResult.success("Google Gemini API test successful");
                } else {
                    return AIProviderTestResult.failure("Unexpected response format from Gemini API");
                }
            } else {
                return AIProviderTestResult.failure("Gemini API returned status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            return AIProviderTestResult.failure("Gemini API test failed: " + e.getMessage());
        }
    }

    private AIProviderTestResult testOpenRouter(String apiKey, String endpoint, String model) {
        try {
            String base = (endpoint == null || endpoint.isBlank()) ? "https://openrouter.ai/api/v1" : endpoint;
            String url = base.endsWith("/chat/completions") ? base : base + "/chat/completions";

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", (model == null || model.isBlank()) ? "anthropic/claude-3.5-sonnet" : model);

            Map<String, Object> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", "Hello, this is a test message. Please respond with 'Test successful'.");
            requestBody.put("messages", new Object[]{message});
            requestBody.put("max_tokens", 30);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                if (responseJson.has("choices")) {
                    return AIProviderTestResult.success("OpenRouter API test successful");
                } else {
                    return AIProviderTestResult.failure("Unexpected response format from OpenRouter API");
                }
            } else {
                return AIProviderTestResult.failure("OpenRouter API returned status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            return AIProviderTestResult.failure("OpenRouter API test failed: " + e.getMessage());
        }
    }

    private AIProviderTestResult testOpenAI(String apiKey, String model) {
        try {
            String url = "https://api.openai.com/v1/chat/completions";

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", (model == null || model.isBlank()) ? "gpt-4o-mini" : model);

            Map<String, Object> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", "Hello, this is a test message. Please respond with 'Test successful'.");
            requestBody.put("messages", new Object[]{message});
            requestBody.put("max_tokens", 30);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                if (responseJson.has("choices")) {
                    return AIProviderTestResult.success("OpenAI API test successful");
                } else {
                    return AIProviderTestResult.failure("Unexpected response format from OpenAI API");
                }
            } else {
                return AIProviderTestResult.failure("OpenAI API returned status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            return AIProviderTestResult.failure("OpenAI API test failed: " + e.getMessage());
        }
    }

    private AIProviderTestResult testOpenAICompatible(String apiKey, String endpoint, String model) {
        if (endpoint == null || endpoint.trim().isEmpty()) {
            return AIProviderTestResult.failure("Endpoint is required for OpenAI Compatible providers");
        }

        try {
            String url = endpoint + "/v1/chat/completions";

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", (model == null || model.isBlank()) ? "gpt-3.5-turbo" : model);

            Map<String, Object> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", "Hello, this is a test message. Please respond with 'Test successful'.");
            requestBody.put("messages", new Object[]{message});
            requestBody.put("max_tokens", 30);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                if (responseJson.has("choices")) {
                    return AIProviderTestResult.success("OpenAI Compatible API test successful");
                } else {
                    return AIProviderTestResult.failure("Unexpected response format from OpenAI Compatible API");
                }
            } else {
                return AIProviderTestResult.failure("OpenAI Compatible API returned status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            return AIProviderTestResult.failure("OpenAI Compatible API test failed: " + e.getMessage());
        }
    }

    private AIProviderTestResult testZAI(String apiKey, String endpoint, String model) {
        try {
            // Use resilience service to ensure consistency with menu description generation
            String serviceName = "z_ai";

            String result = resilienceService.executeWithResilience(
                serviceName,
                () -> {
                    try {
                        // Use the official Z.AI API endpoint from documentation
                        String url = (endpoint != null && !endpoint.isBlank()) ? endpoint : "https://api.z.ai/api/paas/v4/chat/completions";

                        Map<String, Object> requestBody = new HashMap<>();
                        requestBody.put("model", (model == null || model.isBlank()) ? "glm-4.5-flash" : model);

                        Map<String, Object> message = new HashMap<>();
                        message.put("role", "user");
                        message.put("content", "Hello, this is a test message. Please respond with 'Test successful'.");
                        requestBody.put("messages", new Object[]{message});
                        requestBody.put("max_tokens", 30);

                        HttpHeaders headers = new HttpHeaders();
                        headers.setContentType(MediaType.APPLICATION_JSON);
                        headers.setBearerAuth(apiKey);
                        headers.set("Accept-Language", "en-US,en");

                        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
                        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

                        if (response.getStatusCode() == HttpStatus.OK) {
                            JsonNode responseJson = objectMapper.readTree(response.getBody());
                            if (responseJson.has("choices") && responseJson.get("choices").size() > 0) {
                                JsonNode choice = responseJson.get("choices").get(0);
                                JsonNode msg = choice.get("message");
                                if (msg != null && msg.has("content")) {
                                    String content = msg.get("content").asText();
                                    return content;
                                }
                            }
                            throw new RuntimeException("Invalid response format from Z.AI");
                        } else {
                            throw new RuntimeException("Z.AI API error: " + response.getStatusCode() + " - " + response.getBody());
                        }
                    } catch (Exception e) {
                        throw new RuntimeException("Z.AI API call failed: " + e.getMessage(), e);
                    }
                },
                () -> {
                    throw new RuntimeException("Z.AI service temporarily unavailable - circuit breaker is open");
                }
            );

            return AIProviderTestResult.success("Test successful. Response: " + result);
        } catch (Exception e) {
            return AIProviderTestResult.failure("Z.AI test failed: " + e.getMessage());
        }
    }
}
