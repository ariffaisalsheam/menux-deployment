package com.menux.menu_x_backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.menux.menu_x_backend.entity.AIProviderConfig;
import com.menux.menu_x_backend.exception.AIServiceException;
import com.menux.menu_x_backend.repository.AIProviderConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AIProviderService {

    private static final Logger logger = LoggerFactory.getLogger(AIProviderService.class);

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AIProviderConfigRepository aiProviderConfigRepository;
    private final EncryptionService encryptionService;
    private final AIUsageService aiUsageService;

    @Autowired
    private ExternalApiResilienceService resilienceService;

    public AIProviderService(
            AIProviderConfigRepository aiProviderConfigRepository,
            EncryptionService encryptionService,
            AIUsageService aiUsageService
    ) {
        this.aiProviderConfigRepository = aiProviderConfigRepository;
        this.encryptionService = encryptionService;
        this.aiUsageService = aiUsageService;
    }

    public String generateMenuDescription(String itemName) {
        String prompt = "You are an expert food writer for a restaurant menu. Generate a creative and appealing one-sentence description for the following menu item: " +
                itemName +
                ". The description should be brief, enticing, and make the customer want to order it.";
        return callPrimaryProvider(prompt);
    }

    public String analyzeFeedback(String feedback) {
        String prompt =
                "You are an AI assistant for a restaurant manager. Analyze the data and return STRICT JSON ONLY (no markdown, no prose)." +
                "\nSchema: {" +
                "\"overallSentiment\": \"Positive\"|\"Neutral\"|\"Negative\", " +
                "\"highlights\": [string], " +
                "\"keyComplaints\": [string], " +
                "\"recommendations\": [string], " +
                "\"summary\": string" +
                "}" +
                "\nRules: lists 3-5 items max, short phrases, customer-friendly. Keep under 120 words total.\n" +
                "Input feedback data follows:\n---\n" + feedback + "\n---";
        return callPrimaryProvider(prompt);
    }

    private String callPrimaryProvider(String userPrompt) {
        // Validate input
        if (userPrompt == null || userPrompt.trim().isEmpty()) {
            throw new AIServiceException("Invalid request data", "INVALID_INPUT");
        }

        List<AIProviderConfig> actives = aiProviderConfigRepository.findActiveProvidersOrderedByPriority();
        logger.info("Found {} active AI providers", actives != null ? actives.size() : 0);

        if (actives == null || actives.isEmpty()) {
            logger.warn("No active AI providers found");
            throw new AIServiceException("AI service temporarily unavailable", "NO_ACTIVE_PROVIDERS");
        }

        AIProviderConfig primary = actives.get(0);
        String serviceName = primary.getType().toString().toLowerCase().replace("_glm_4_5", "");
        logger.info("Using primary AI provider: {} (ID: {}, Name: {})", primary.getType(), primary.getId(), primary.getName());

        try {
            // Use resilience service with circuit breaker and retry logic
            return resilienceService.executeWithResilience(
                serviceName,
                () -> {
                    try {
                        String apiKey = encryptionService.decrypt(primary.getEncryptedApiKey());
                        String result;

                        logger.info("Calling AI provider: {} (ID: {}) with model: {}, endpoint: {}, prompt length: {}",
                            primary.getType(), primary.getId(), primary.getModel(), primary.getEndpoint(), userPrompt.length());

                        switch (primary.getType()) {
                            case GOOGLE_GEMINI:
                                result = callGoogleGemini(apiKey, primary.getModel(), userPrompt);
                                break;
                            case OPENAI:
                                result = callOpenAI(apiKey, primary.getModel(), userPrompt, null);
                                break;
                            case OPENROUTER:
                                result = callOpenRouter(apiKey, primary.getEndpoint(), primary.getModel(), userPrompt);
                                break;
                            case OPENAI_COMPATIBLE:
                                result = callOpenAI(apiKey, primary.getModel(), userPrompt, primary.getEndpoint());
                                break;
                            case Z_AI_GLM_4_5:
                                result = callZAI(apiKey, primary.getEndpoint(), userPrompt,
                                        (primary.getModel() == null || primary.getModel().isBlank()) ? "glm-4.5-flash" : primary.getModel());
                                break;
                            default:
                                throw new AIServiceException("Unsupported AI provider configured", "UNSUPPORTED_PROVIDER");
                        }

                        // Validate result - but let specific provider errors bubble up
                        if (result == null || result.trim().isEmpty()) {
                            throw new AIServiceException("AI provider returned empty response", "EMPTY_RESPONSE");
                        }

                        aiUsageService.recordUse(primary.getId());
                        logger.info("AI provider {} call successful. Response length: {} characters", primary.getType(), result.length());
                        return result;

                    } catch (AIServiceException e) {
                        // Re-throw AI service exceptions as-is
                        throw e;
                    } catch (Exception e) {
                        aiUsageService.recordError(primary.getId());
                        logger.error("AI provider {} (ID: {}) call failed with exception: {}", primary.getType(), primary.getId(), e.getMessage(), e);

                        // Return the exact error message from the provider for detailed debugging
                        String detailedMessage = e.getMessage() != null ? e.getMessage() : "Unknown provider error";
                        throw new AIServiceException("Provider " + primary.getType() + " error: " + detailedMessage, "PROVIDER_ERROR", e);
                    }
                },
                () -> {
                    // Fallback should also throw an exception instead of returning mock text
                    logger.warn("Circuit breaker open for AI provider: {}", serviceName);
                    throw new AIServiceException("AI service temporarily unavailable - circuit breaker is open. Please try again later.", "CIRCUIT_BREAKER_OPEN");
                }
            );
        } catch (AIServiceException e) {
            // Re-throw AI service exceptions as-is
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error in AI service: {}", e.getMessage(), e);
            throw new AIServiceException("Failed to generate response, please contact support", "UNEXPECTED_ERROR", e);
        }
    }



    private String callGoogleGemini(String apiKey, String model, String userPrompt) throws Exception {
        String mdl = (model == null || model.isBlank()) ? "gemini-2.5-flash" : model;
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + mdl + ":generateContent?key=" + apiKey;

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> contents = new HashMap<>();
        Map<String, Object> parts = new HashMap<>();
        parts.put("text", userPrompt);
        contents.put("parts", new Object[]{parts});
        requestBody.put("contents", new Object[]{contents});

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

        if (response.getStatusCode() == HttpStatus.OK) {
            JsonNode responseJson = objectMapper.readTree(response.getBody());
            if (responseJson.has("candidates") && responseJson.get("candidates").size() > 0) {
                JsonNode candidate = responseJson.get("candidates").get(0);
                if (candidate.has("content") && candidate.get("content").has("parts") &&
                        candidate.get("content").get("parts").size() > 0) {
                    JsonNode part = candidate.get("content").get("parts").get(0);
                    if (part.has("text")) {
                        return part.get("text").asText().trim();
                    }
                }
            }
        }

        // Provide detailed error information
        String errorDetails = response.getBody() != null ? response.getBody() : "No response body";
        throw new RuntimeException("Invalid response from Gemini API. Status: " + response.getStatusCode() + ", Response: " + errorDetails);
    }

    private String callOpenRouter(String apiKey, String endpoint, String model, String userPrompt) throws Exception {
        String base = (endpoint == null || endpoint.isBlank()) ? "https://openrouter.ai/api/v1" : endpoint;
        String url = base.endsWith("/chat/completions") ? base : base + "/chat/completions";
        String finalModel = (model == null || model.isBlank()) ? "anthropic/claude-3.5-sonnet" : model;

        logger.info("OpenRouter API call - URL: {}, Model: {}, API Key length: {}", url, finalModel, apiKey != null ? apiKey.length() : 0);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", finalModel);

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", userPrompt);
        requestBody.put("messages", new Object[]{message});
        requestBody.put("max_tokens", 256);
        requestBody.put("temperature", 0.7);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        // OpenRouter recommends including these headers
        headers.set("HTTP-Referer", "https://menu-x.app");
        headers.set("X-Title", "Menu.X AI Assistant");

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            logger.info("OpenRouter request body: {}", objectMapper.writeValueAsString(requestBody));
            logger.info("OpenRouter request headers: Authorization=Bearer {}, Content-Type={}, HTTP-Referer={}, X-Title={}",
                apiKey != null ? "***" + apiKey.substring(Math.max(0, apiKey.length() - 4)) : "null",
                headers.getContentType(),
                headers.getFirst("HTTP-Referer"),
                headers.getFirst("X-Title"));

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            logger.info("OpenRouter response status: {}, headers: {}, body: {}",
                response.getStatusCode(),
                response.getHeaders(),
                response.getBody());

            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                if (responseJson.has("choices") && responseJson.get("choices").size() > 0) {
                    JsonNode choice = responseJson.get("choices").get(0);
                    JsonNode msg = choice.get("message");
                    if (msg != null) {
                        String content = extractContentFromMessage(msg);

                        if (content != null && !content.isEmpty()) {
                            logger.info("OpenRouter extracted content ({} chars)", content.length());
                            return content;
                        } else {
                            logger.error("OpenRouter response has empty content. Message node: {}", msg);
                        }
                    } else {
                        logger.error("OpenRouter response missing message. Choice structure: {}", choice);
                    }
                } else {
                    logger.error("OpenRouter response missing choices. Full response: {}", responseJson);
                }
            } else {
                String rawBody = response.getBody();
                String detailedError = rawBody;
                try {
                    if (rawBody != null && !rawBody.isBlank()) {
                        JsonNode errJson = objectMapper.readTree(rawBody);
                        if (errJson.has("error")) {
                            JsonNode eNode = errJson.get("error");
                            if (eNode.has("message")) detailedError = eNode.get("message").asText();
                            else if (eNode.has("name")) detailedError = eNode.get("name").asText();
                            else detailedError = eNode.toString();
                        }
                    }
                } catch (Exception parseErr) {
                    // keep original raw body if parsing fails
                }
                logger.error("OpenRouter API returned non-200 status: {} - Details: {}", response.getStatusCode(), detailedError);
                throw new AIServiceException("OpenRouter API error: " + response.getStatusCode() + " - " + detailedError, "OPENROUTER_API_ERROR");
            }
        } catch (Exception e) {
            logger.error("OpenRouter API call failed with exception: {}", e.getMessage(), e);
            throw new AIServiceException("OpenRouter API call failed: " + e.getMessage(), "OPENROUTER_CALL_FAILED", e);
        }
        throw new AIServiceException("Invalid response from OpenRouter API - no valid content found", "OPENROUTER_INVALID_RESPONSE");
    }

    // Extracts textual content from OpenRouter/OpenAI-style message nodes, handling both string and array forms
    private String extractContentFromMessage(JsonNode msg) {
        if (msg == null) return null;

        // Primary: content field (may be string or array of blocks)
        if (msg.has("content")) {
            JsonNode contentNode = msg.get("content");
            if (contentNode.isTextual()) {
                String s = contentNode.asText();
                return s != null ? s.trim() : null;
            }
            if (contentNode.isArray()) {
                StringBuilder sb = new StringBuilder();
                for (JsonNode part : contentNode) {
                    // Common shapes: {"type":"text","text":"..."} or {"content":"..."}
                    if (part.has("text") && part.get("text").isTextual()) {
                        sb.append(part.get("text").asText());
                    } else if (part.has("content") && part.get("content").isTextual()) {
                        sb.append(part.get("content").asText());
                    } else if (part.isTextual()) {
                        sb.append(part.asText());
                    }
                }
                String joined = sb.toString().trim();
                if (!joined.isEmpty()) return joined;
            }
        }

        // Fallbacks used by some providers
        if (msg.has("reasoning") && msg.get("reasoning").isTextual()) {
            String s = msg.get("reasoning").asText();
            return s != null ? s.trim() : null;
        }
        if (msg.has("reasoning_content") && msg.get("reasoning_content").isTextual()) {
            String s = msg.get("reasoning_content").asText();
            return s != null ? s.trim() : null;
        }

        return null;
    }

    private String callOpenAI(String apiKey, String model, String userPrompt, String customEndpointOrNull) throws Exception {
        String base = (customEndpointOrNull == null || customEndpointOrNull.isBlank()) ? "https://api.openai.com" : customEndpointOrNull;
        String url = base + "/v1/chat/completions";

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", (model == null || model.isBlank()) ? "gpt-4o-mini" : model);
        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", userPrompt);
        requestBody.put("messages", new Object[]{message});
        requestBody.put("max_tokens", 120);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

        if (response.getStatusCode() == HttpStatus.OK) {
            JsonNode responseJson = objectMapper.readTree(response.getBody());
            if (responseJson.has("choices") && responseJson.get("choices").size() > 0) {
                JsonNode choice = responseJson.get("choices").get(0);
                JsonNode msg = choice.get("message");
                if (msg != null && msg.has("content")) {
                    return msg.get("content").asText().trim();
                }
            }
        }

        // Provide detailed error information
        String errorDetails = response.getBody() != null ? response.getBody() : "No response body";
        throw new RuntimeException("Invalid response from OpenAI-compatible API. Status: " + response.getStatusCode() + ", Response: " + errorDetails);
    }

    private String callZAI(String apiKey, String endpoint, String userPrompt, String model) throws Exception {
        // Use the official Z.AI API endpoint from documentation
        String url = "https://api.z.ai/api/paas/v4/chat/completions";
        String finalModel = (model == null || model.isBlank()) ? "glm-4.5-flash" : model;

        logger.info("Z.AI API call - URL: {}, Model: {}, API Key length: {}, Prompt length: {}",
            url, finalModel, apiKey != null ? apiKey.length() : 0, userPrompt != null ? userPrompt.length() : 0);

        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new AIServiceException("Z.AI API key is missing or empty", "INVALID_API_KEY");
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", finalModel);

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        // Modify the prompt to get a direct response without reasoning
        String directPrompt = userPrompt + " Please provide only the final menu description, not your reasoning process.";
        message.put("content", directPrompt);
        requestBody.put("messages", new Object[]{message});
        requestBody.put("max_tokens", 120);
        requestBody.put("temperature", 0.7);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        headers.set("Accept-Language", "en-US,en");

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            logger.info("Z.AI request body: {}", objectMapper.writeValueAsString(requestBody));
            logger.info("Z.AI request headers: Authorization=Bearer {}, Content-Type={}",
                apiKey != null ? "***" + apiKey.substring(Math.max(0, apiKey.length() - 4)) : "null",
                headers.getContentType());

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            logger.info("Z.AI response status: {}, headers: {}, body: {}",
                response.getStatusCode(),
                response.getHeaders(),
                response.getBody());

            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                if (responseJson.has("choices") && responseJson.get("choices").size() > 0) {
                    JsonNode choice = responseJson.get("choices").get(0);
                    JsonNode msg = choice.get("message");
                    if (msg != null) {
                        String content = null;

                        // Try to get content from 'content' field first
                        if (msg.has("content")) {
                            content = msg.get("content").asText();
                            if (content != null) content = content.trim();
                        }

                        // If content is empty or just whitespace, try 'reasoning_content'
                        if ((content == null || content.isEmpty()) && msg.has("reasoning_content")) {
                            content = msg.get("reasoning_content").asText();
                            if (content != null) content = content.trim();
                            logger.info("Z.AI using reasoning_content as main content");
                        }

                        logger.info("Z.AI extracted content: {}", content);

                        if (content != null && !content.isEmpty()) {
                            return content;
                        } else {
                            logger.error("Z.AI response has empty content in both 'content' and 'reasoning_content' fields. Message structure: {}", msg);
                            throw new AIServiceException("Z.AI returned empty content in both 'content' and 'reasoning_content' fields", "Z_AI_EMPTY_RESPONSE");
                        }
                    } else {
                        logger.error("Z.AI response missing message. Choice structure: {}", choice);
                        throw new AIServiceException("Z.AI response missing message", "Z_AI_INVALID_RESPONSE");
                    }
                } else {
                    logger.error("Z.AI response missing choices. Full response: {}", responseJson);
                    throw new AIServiceException("Z.AI response missing choices array", "Z_AI_INVALID_RESPONSE");
                }
            } else {
                logger.error("Z.AI API returned non-200 status: {} - Response body: {}", response.getStatusCode(), response.getBody());
                throw new AIServiceException("Z.AI API error: " + response.getStatusCode() + " - " + response.getBody(), "Z_AI_API_ERROR");
            }
        } catch (AIServiceException e) {
            // Re-throw AIServiceException as-is
            throw e;
        } catch (Exception e) {
            logger.error("Z.AI API call failed with exception: {}", e.getMessage(), e);
            if (e.getMessage() != null && e.getMessage().contains("Connection refused")) {
                throw new AIServiceException("Cannot connect to Z.AI API. Please check your internet connection.", "Z_AI_CONNECTION_ERROR");
            } else if (e.getMessage() != null && e.getMessage().contains("401")) {
                throw new AIServiceException("Invalid Z.AI API key. Please check your API key.", "Z_AI_AUTH_ERROR");
            } else {
                throw new AIServiceException("Z.AI API call failed: " + e.getMessage(), "Z_AI_UNKNOWN_ERROR");
            }
        }
    }

    // Test method for debugging AI providers
    public String testProviderDirectly(String providerType, String apiKey, String prompt) throws Exception {
        logger.info("Testing provider directly: {} with prompt: {}", providerType, prompt);

        switch (providerType.toUpperCase()) {
            case "Z_AI":
            case "Z.AI":
                return callZAI(apiKey, "https://api.z.ai/api/paas/v4/chat/completions", prompt, "glm-4.5-flash");
            case "OPENROUTER":
                return callOpenRouter(apiKey, "https://openrouter.ai/api/v1/chat/completions", "anthropic/claude-3.5-sonnet", prompt);
            case "GOOGLE_GEMINI":
            case "GEMINI":
                return callGoogleGemini(apiKey, "gemini-2.5-flash", prompt);
            default:
                throw new IllegalArgumentException("Unknown provider type: " + providerType);
        }
    }
}
