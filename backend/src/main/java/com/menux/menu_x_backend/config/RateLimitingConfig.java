package com.menux.menu_x_backend.config;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Rate limiting configuration to prevent API abuse
 */
@Configuration
public class RateLimitingConfig {

    @Bean
    public RateLimitingFilter rateLimitingFilter() {
        return new RateLimitingFilter();
    }

    public static class RateLimitingFilter extends OncePerRequestFilter {

        // Track counters per client AND per endpoint bucket to avoid unrelated endpoints sharing the same quota
        private final ConcurrentHashMap<String, ConcurrentHashMap<String, ClientRequestInfo>> clientRequests = new ConcurrentHashMap<>();

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                      FilterChain filterChain) throws ServletException, IOException {
            
            String clientId = getClientIdentifier(request);
            String endpoint = request.getRequestURI();
            
            if (isRateLimited(clientId, endpoint)) {
                response.setStatus(429); // Too Many Requests
                response.setHeader("X-RateLimit-Limit", String.valueOf(getRateLimit(endpoint)));
                response.setHeader("X-RateLimit-Remaining", "0");
                response.setHeader("Retry-After", "60");
                response.getWriter().write("{\"error\":\"Rate limit exceeded. Please try again later.\"}");
                return;
            }

            filterChain.doFilter(request, response);
        }

        private String getClientIdentifier(HttpServletRequest request) {
            // Use IP address as client identifier
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                return xForwardedFor.split(",")[0].trim();
            }
            return request.getRemoteAddr();
        }

        private boolean isRateLimited(String clientId, String endpoint) {
            String bucketKey = getBucketKey(endpoint);

            ConcurrentHashMap<String, ClientRequestInfo> buckets =
                clientRequests.computeIfAbsent(clientId, k -> new ConcurrentHashMap<>());

            ClientRequestInfo info = buckets.computeIfAbsent(bucketKey, k -> new ClientRequestInfo());

            LocalDateTime now = LocalDateTime.now();

            // Reset counter if window has passed
            if (now.isAfter(info.windowStart.plusMinutes(1))) {
                info.requestCount = 0;
                info.windowStart = now;
            }

            info.requestCount++;

            int limit = getRateLimit(endpoint);
            return info.requestCount > limit;
        }

        private int getRateLimit(String endpoint) {
            // Check if we're in development mode (more lenient limits)
            boolean isDevelopment = isLocalDevelopment();

            if (endpoint.contains("/auth/register")) {
                return isDevelopment ? 10 : 3; // More lenient in dev
            } else if (endpoint.contains("/auth/login")) {
                return isDevelopment ? 30 : 10; // More lenient in dev
            } else if (endpoint.contains("/auth/")) {
                return isDevelopment ? 50 : 15; // More lenient in dev
            } else if (endpoint.contains("/ai/")) {
                return isDevelopment ? 30 : 10; // More lenient in dev
            } else if (endpoint.contains("/public/")) {
                return isDevelopment ? 200 : 50; // More lenient in dev
            } else if (endpoint.contains("/notifications/") || endpoint.contains("/admin/")) {
                return isDevelopment ? 300 : 100; // Very lenient for admin/notifications in dev
            } else {
                return isDevelopment ? 500 : 100; // Much more lenient in dev
            }
        }

        private boolean isLocalDevelopment() {
            // Check if we're running in local development environment
            String profile = System.getProperty("spring.profiles.active");
            String port = System.getProperty("server.port", System.getenv("PORT"));

            // Consider it development if running on default dev port or no specific profile
            return (port != null && port.equals("8080")) ||
                   (profile == null || profile.contains("dev") || profile.contains("local"));
        }

        // Group similar endpoints into buckets so each group has its own counter
        private String getBucketKey(String endpoint) {
            if (endpoint.contains("/auth/register")) {
                return "auth_register";
            } else if (endpoint.contains("/auth/login")) {
                return "auth_login";
            } else if (endpoint.contains("/auth/")) {
                return "auth";
            } else if (endpoint.contains("/ai/feedback-analysis")) {
                return "ai_feedback";
            } else if (endpoint.contains("/ai/")) {
                return "ai";
            } else if (endpoint.contains("/public/")) {
                return "public";
            } else {
                return "other";
            }
        }

        private static class ClientRequestInfo {
            int requestCount = 0;
            LocalDateTime windowStart = LocalDateTime.now();
        }
    }
}
