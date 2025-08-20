package com.menux.menu_x_backend.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@Component
public class WebSocketAuthInterceptor implements HandshakeInterceptor {
    private static final Logger log = LoggerFactory.getLogger(WebSocketAuthInterceptor.class);

    private final JwtUtil jwtUtil;

    public WebSocketAuthInterceptor(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        String token = resolveToken(request);
        if (token == null) {
            return false;
        }
        try {
            if (jwtUtil.validateToken(token)) {
                String username = jwtUtil.extractUsername(token);
                attributes.put("ws_username", username);
                return true;
            }
        } catch (Exception e) {
            log.debug("WS handshake token validation failed: {}", e.getMessage());
        }
        return false;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // no-op
    }

    private String resolveToken(ServerHttpRequest request) {
        if (request instanceof ServletServerHttpRequest servletRequest) {
            HttpServletRequest httpReq = servletRequest.getServletRequest();
            String auth = httpReq.getHeader("Authorization");
            if (auth != null && auth.startsWith("Bearer ")) {
                return auth.substring(7);
            }
            // Fallback to access_token query parameter if present
            String tokenParam = httpReq.getParameter("access_token");
            if (tokenParam != null && !tokenParam.isBlank()) {
                return tokenParam;
            }
        }
        // Also check Sec-WebSocket-Protocol style headers if client sends token there
        List<String> protocols = request.getHeaders().get("Sec-WebSocket-Protocol");
        if (protocols != null) {
            for (String p : protocols) {
                if (p != null && p.startsWith("Bearer ")) {
                    return p.substring(7);
                }
            }
        }
        return null;
    }
}
