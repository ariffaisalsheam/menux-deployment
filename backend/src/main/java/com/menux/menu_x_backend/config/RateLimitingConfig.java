package com.menux.menu_x_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

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

        private final ConcurrentHashMap<String, ClientRequestInfo> clientRequests = new ConcurrentHashMap<>();

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
            ClientRequestInfo info = clientRequests.computeIfAbsent(clientId, k -> new ClientRequestInfo());
            
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
            if (endpoint.contains("/auth/register")) {
                return 3; // 3 registration attempts per minute (reasonable for account creation)
            } else if (endpoint.contains("/auth/login")) {
                return 10; // 10 login attempts per minute (reasonable for login retries)
            } else if (endpoint.contains("/auth/")) {
                return 15; // 15 requests per minute for other auth endpoints
            } else if (endpoint.contains("/ai/")) {
                return 10; // 10 requests per minute for AI endpoints
            } else if (endpoint.contains("/public/")) {
                return 50; // 50 requests per minute for public endpoints
            } else {
                return 100; // 100 requests per minute for other endpoints
            }
        }

        private static class ClientRequestInfo {
            int requestCount = 0;
            LocalDateTime windowStart = LocalDateTime.now();
        }
    }
}
