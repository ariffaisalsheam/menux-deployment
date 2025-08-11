package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.dto.ai.AIProviderTestResult;
import com.menux.menu_x_backend.entity.AIProviderConfig;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class AIProviderTestService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AIProviderTestResult testProvider(AIProviderConfig.ProviderType type, String apiKey, String endpoint, String settings) {
        try {
            switch (type) {
                case GOOGLE_GEMINI:
                    return testGoogleGemini(apiKey);
                case OPENROUTER:
                    return testOpenRouter(apiKey, endpoint);
                case OPENAI:
                    return testOpenAI(apiKey);
                case OPENAI_COMPATIBLE:
                    return testOpenAICompatible(apiKey, endpoint);
                case Z_AI_GLM_4_5:
                    return testZAIGLM45(apiKey, endpoint);
                default:
                    return AIProviderTestResult.failure("Unsupported provider type: " + type);
            }
        } catch (Exception e) {
            return AIProviderTestResult.failure("Test failed: " + e.getMessage());
        }
    }

    private AIProviderTestResult testGoogleGemini(String apiKey) {
        try {
            String url = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=" + apiKey;
            
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

    private AIProviderTestResult testOpenRouter(String apiKey, String endpoint) {
        try {
            String url = endpoint != null ? endpoint : "https://openrouter.ai/api/v1/chat/completions";
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "openai/gpt-3.5-turbo");
            
            Map<String, Object> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", "Hello, this is a test message. Please respond with 'Test successful'.");
            requestBody.put("messages", new Object[]{message});
            requestBody.put("max_tokens", 50);

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

    private AIProviderTestResult testOpenAI(String apiKey) {
        try {
            String url = "https://api.openai.com/v1/chat/completions";
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-3.5-turbo");
            
            Map<String, Object> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", "Hello, this is a test message. Please respond with 'Test successful'.");
            requestBody.put("messages", new Object[]{message});
            requestBody.put("max_tokens", 50);

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

    private AIProviderTestResult testOpenAICompatible(String apiKey, String endpoint) {
        if (endpoint == null || endpoint.trim().isEmpty()) {
            return AIProviderTestResult.failure("Endpoint is required for OpenAI Compatible providers");
        }

        try {
            String url = endpoint + "/v1/chat/completions";
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-3.5-turbo"); // Default model, can be configured
            
            Map<String, Object> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", "Hello, this is a test message. Please respond with 'Test successful'.");
            requestBody.put("messages", new Object[]{message});
            requestBody.put("max_tokens", 50);

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

    private AIProviderTestResult testZAIGLM45(String apiKey, String endpoint) {
        try {
            String url = endpoint != null ? endpoint : "https://api.z.ai/v1/chat/completions";
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "glm-4.5");
            
            Map<String, Object> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", "Hello, this is a test message. Please respond with 'Test successful'.");
            requestBody.put("messages", new Object[]{message});
            requestBody.put("max_tokens", 50);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                if (responseJson.has("choices")) {
                    return AIProviderTestResult.success("Z.AI GLM-4.5 API test successful");
                } else {
                    return AIProviderTestResult.failure("Unexpected response format from Z.AI GLM-4.5 API");
                }
            } else {
                return AIProviderTestResult.failure("Z.AI GLM-4.5 API returned status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            return AIProviderTestResult.failure("Z.AI GLM-4.5 API test failed: " + e.getMessage());
        }
    }
}
