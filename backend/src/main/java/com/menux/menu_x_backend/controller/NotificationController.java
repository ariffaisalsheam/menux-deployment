package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.dto.common.PageResponse;
import com.menux.menu_x_backend.dto.notifications.NotificationDto;
import com.menux.menu_x_backend.dto.notifications.NotificationPreferenceDto;
import com.menux.menu_x_backend.dto.notifications.RegisterFcmTokenRequest;
import com.menux.menu_x_backend.dto.notifications.UpdatePreferencesRequest;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.repository.UserRepository;
import com.menux.menu_x_backend.service.NotificationService;
import com.menux.menu_x_backend.service.realtime.SseEmitterRegistry;
import com.menux.menu_x_backend.service.FcmService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.servlet.http.HttpServletResponse;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;


    @Autowired
    private SseEmitterRegistry sseEmitterRegistry;

    @Autowired
    private FcmService fcmService;

    private Optional<User> currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return Optional.empty();
        return userRepository.findByUsername(auth.getName());
    }

    @GetMapping
    public ResponseEntity<PageResponse<NotificationDto>> list(
            @RequestParam(value = "unreadOnly", required = false, defaultValue = "false") boolean unreadOnly,
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size
    ) {
        Optional<User> userOpt = currentUser();
        if (userOpt.isEmpty()) return ResponseEntity.status(401).build();
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)));
        Page<NotificationDto> result = notificationService.list(userOpt.get().getId(), unreadOnly, pageable);
        return ResponseEntity.ok(PageResponse.from(result));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> unreadCount() {
        Optional<User> userOpt = currentUser();
        if (userOpt.isEmpty()) return ResponseEntity.status(401).build();
        long count = notificationService.unreadCount(userOpt.get().getId());
        return ResponseEntity.ok(count);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable("id") Long id) {
        Optional<User> userOpt = currentUser();
        if (userOpt.isEmpty()) return ResponseEntity.status(401).build();
        boolean ok = notificationService.markRead(userOpt.get().getId(), id);
        return ok ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Integer> markAllRead() {
        Optional<User> userOpt = currentUser();
        if (userOpt.isEmpty()) return ResponseEntity.status(401).build();
        int updated = notificationService.markAllRead(userOpt.get().getId());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOne(@PathVariable("id") Long id) {
        Optional<User> userOpt = currentUser();
        if (userOpt.isEmpty()) return ResponseEntity.status(401).build();
        boolean ok = notificationService.deleteOne(userOpt.get().getId(), id);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    // Fallback alias used by some clients
    @PostMapping("/{id}/dismiss")
    public ResponseEntity<Void> dismissOne(@PathVariable("id") Long id) {
        return deleteOne(id);
    }

    @DeleteMapping
    public ResponseEntity<Integer> deleteAll() {
        Optional<User> userOpt = currentUser();
        if (userOpt.isEmpty()) return ResponseEntity.status(401).build();
        int deleted = notificationService.deleteAll(userOpt.get().getId());
        return ResponseEntity.ok(deleted);
    }

    // Fallback aliases for bulk clear
    @PostMapping("/dismiss-all")
    public ResponseEntity<Integer> dismissAll() { return deleteAll(); }

    @PostMapping("/clear-all")
    public ResponseEntity<Integer> clearAll() { return deleteAll(); }

    @GetMapping("/preferences")
    public ResponseEntity<NotificationPreferenceDto> getPreferences() {
        Optional<User> userOpt = currentUser();
        if (userOpt.isEmpty()) return ResponseEntity.status(401).build();
        NotificationPreferenceDto dto = notificationService.getPreferences(userOpt.get().getId());
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/preferences")
    public ResponseEntity<NotificationPreferenceDto> updatePreferences(@Valid @RequestBody UpdatePreferencesRequest req) {
        Optional<User> userOpt = currentUser();
        if (userOpt.isEmpty()) return ResponseEntity.status(401).build();
        NotificationPreferenceDto dto = notificationService.updatePreferences(userOpt.get().getId(), req);
        return ResponseEntity.ok(dto);
    }


    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(HttpServletResponse response) {
        Optional<User> userOpt = currentUser();
        if (userOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        // Recommended headers for SSE to avoid proxy buffering and enable long-lived connections
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("X-Accel-Buffering", "no"); // for nginx/Render-like proxies
        response.setHeader("Connection", "keep-alive");
        SseEmitter emitter = sseEmitterRegistry.register(userOpt.get().getId());
        if (emitter == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "SSE disabled");
        }
        return emitter;
    }

    // Firebase Cloud Messaging token management (scaffolded; persistence will be added via migrations)
    @PostMapping("/fcm-tokens")
    public ResponseEntity<Void> registerFcmToken(@Valid @RequestBody RegisterFcmTokenRequest req) {
        Optional<User> userOpt = currentUser();
        if (userOpt.isEmpty()) return ResponseEntity.status(401).build();
        fcmService.registerUserToken(userOpt.get().getId(), req);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/fcm-tokens")
    public ResponseEntity<Void> removeFcmToken(@RequestParam("token") String token) {
        Optional<User> userOpt = currentUser();
        if (userOpt.isEmpty()) return ResponseEntity.status(401).build();
        fcmService.removeUserToken(userOpt.get().getId(), token);
        return ResponseEntity.noContent().build();
    }

    // Legacy helpers removed with Web Push deprecation
}
