package com.menux.menu_x_backend.security;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

@Component
public class WebSocketAuthHandshakeHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler, Map<String, Object> attributes) {
        Object usernameObj = attributes.get("ws_username");
        if (usernameObj instanceof String username && !username.isBlank()) {
            return new StompPrincipal(username);
        }
        return null; // reject if no principal; interceptor should have blocked earlier
    }

    static class StompPrincipal implements Principal {
        private final String name;
        StompPrincipal(String name) { this.name = name; }
        @Override
        public String getName() { return name; }
    }
}
