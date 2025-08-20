package com.menux.menu_x_backend.service.realtime;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

@Service
public class SseEmitterRegistry {
    private static final Logger log = LoggerFactory.getLogger(SseEmitterRegistry.class);

    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

    @Value("${app.notifications.features.sse:true}")
    private boolean sseEnabled;

    @Value("${app.notifications.sse.heartbeat-ms:25000}")
    private long heartbeatMs;

    private final ScheduledExecutorService heartbeatScheduler = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "sse-heartbeat");
        t.setDaemon(true);
        return t;
    });

    @PostConstruct
    void initHeartbeat() {
        heartbeatScheduler.scheduleAtFixedRate(this::sendHeartbeat, heartbeatMs, heartbeatMs, TimeUnit.MILLISECONDS);
    }

    public SseEmitter register(Long userId) {
        if (!sseEnabled) {
            return null;
        }
        // Keep-alive: use a very long timeout; we'll send periodic heartbeats
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError(e -> removeEmitter(userId, emitter));

        try {
            // Initial event to open stream on some proxies
            emitter.send(SseEmitter.event().name("init").data("ok"));
        } catch (IOException e) {
            removeEmitter(userId, emitter);
        }
        return emitter;
    }

    public void sendToUser(Long userId, Object payload) {
        if (!sseEnabled) return;
        List<SseEmitter> list = emitters.get(userId);
        if (list == null || list.isEmpty()) return;
        for (SseEmitter emitter : list) {
            try {
                emitter.send(payload);
            } catch (IOException e) {
                removeEmitter(userId, emitter);
            }
        }
    }

    private void sendHeartbeat() {
        if (!sseEnabled) return;
        for (Map.Entry<Long, CopyOnWriteArrayList<SseEmitter>> entry : emitters.entrySet()) {
            Long userId = entry.getKey();
            List<SseEmitter> list = entry.getValue();
            if (list == null || list.isEmpty()) continue;
            for (SseEmitter emitter : list) {
                try {
                    // Send comment-only heartbeat so clients don't receive onmessage
                    emitter.send(SseEmitter.event().comment("keepalive"));
                } catch (IOException e) {
                    removeEmitter(userId, emitter);
                }
            }
        }
    }

    private void removeEmitter(Long userId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> list = emitters.get(userId);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) {
                emitters.remove(userId);
            }
        }
    }
}
