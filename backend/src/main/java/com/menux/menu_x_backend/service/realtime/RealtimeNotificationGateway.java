package com.menux.menu_x_backend.service.realtime;

import com.menux.menu_x_backend.dto.notifications.NotificationDto;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class RealtimeNotificationGateway {
    private static final Logger log = LoggerFactory.getLogger(RealtimeNotificationGateway.class);

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final SseEmitterRegistry sseRegistry;

    @Value("${app.notifications.features.ws:true}")
    private boolean wsEnabled;

    public RealtimeNotificationGateway(SimpMessagingTemplate messagingTemplate,
                                       UserRepository userRepository,
                                       SseEmitterRegistry sseRegistry) {
        this.messagingTemplate = messagingTemplate;
        this.userRepository = userRepository;
        this.sseRegistry = sseRegistry;
    }

    public void sendToUser(Long userId, NotificationDto payload) {
        // STOMP/WS
        if (wsEnabled) {
            try {
                Optional<User> userOpt = userRepository.findById(userId);
                if (userOpt.isPresent()) {
                    String username = userOpt.get().getUsername();
                    messagingTemplate.convertAndSendToUser(username, "/queue/notifications", payload);
                }
            } catch (Exception e) {
                log.debug("WS sendToUser failed userId={} err={}", userId, e.getMessage());
            }
        }
        // SSE fallback (no-op if disabled or no listeners)
        try {
            sseRegistry.sendToUser(userId, payload);
        } catch (Exception e) {
            log.debug("SSE sendToUser failed userId={} err={}", userId, e.getMessage());
        }
    }
}
