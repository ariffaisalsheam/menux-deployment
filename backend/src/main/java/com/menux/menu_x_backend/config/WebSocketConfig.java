package com.menux.menu_x_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.beans.factory.annotation.Autowired;
import com.menux.menu_x_backend.security.WebSocketAuthHandshakeHandler;
import com.menux.menu_x_backend.security.WebSocketAuthInterceptor;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${CORS_ALLOWED_ORIGINS:http://localhost:5173}")
    private String allowedOrigins;

    @Autowired
    private WebSocketAuthInterceptor authInterceptor;

    @Autowired
    private WebSocketAuthHandshakeHandler handshakeHandler;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple broker for user and topic destinations
        config.enableSimpleBroker("/user", "/topic");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = allowedOrigins.split(",");
        for (int i = 0; i < origins.length; i++) {
            origins[i] = origins[i].trim();
        }
        registry
                .addEndpoint("/ws")
                .setHandshakeHandler(handshakeHandler)
                .addInterceptors(authInterceptor)
                .setAllowedOriginPatterns(origins)
                .withSockJS();
    }
}
