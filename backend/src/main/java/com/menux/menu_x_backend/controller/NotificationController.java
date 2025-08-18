package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.dto.common.PageResponse;
import com.menux.menu_x_backend.dto.notifications.NotificationDto;
import com.menux.menu_x_backend.dto.notifications.NotificationPreferenceDto;
import com.menux.menu_x_backend.dto.notifications.PushSubscriptionRequest;
import com.menux.menu_x_backend.dto.notifications.UpdatePreferencesRequest;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.repository.UserRepository;
import com.menux.menu_x_backend.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.env.Environment;

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
    private Environment env;

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

    @PostMapping("/push-subscriptions")
    public ResponseEntity<Void> registerPush(@Valid @RequestBody PushSubscriptionRequest req) {
        Optional<User> userOpt = currentUser();
        if (userOpt.isEmpty()) return ResponseEntity.status(401).build();
        notificationService.registerPushSubscription(userOpt.get().getId(), req);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/push-subscriptions/{id}")
    public ResponseEntity<Void> deletePush(@PathVariable("id") Long id) {
        Optional<User> userOpt = currentUser();
        if (userOpt.isEmpty()) return ResponseEntity.status(401).build();
        boolean ok = notificationService.removePushSubscription(userOpt.get().getId(), id);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @GetMapping("/vapid-public-key")
    public ResponseEntity<String> getVapidPublicKey() {
        String key = env.getProperty("VAPID_PUBLIC_KEY");
        if (key == null) {
            return ResponseEntity.noContent().build();
        }
        // Sanitize: trim, strip surrounding quotes, remove any whitespace/newlines
        key = stripQuotes(key.trim()).replaceAll("\\s+", "");
        if (key.isBlank()) {
            return ResponseEntity.noContent().build();
        }
        // Basic validation: URL-safe Base64 chars only
        if (!key.matches("^[A-Za-z0-9_-]+$")) {
            // Return 400 to surface misconfiguration clearly
            return ResponseEntity.badRequest().body("Invalid VAPID public key format. Expect base64url characters only.");
        }
        return ResponseEntity.ok(key);
    }

    private static String stripQuotes(String s) {
        if (s == null || s.length() < 2) return s;
        if ((s.startsWith("\"") && s.endsWith("\"")) || (s.startsWith("'") && s.endsWith("'"))) {
            return s.substring(1, s.length() - 1);
        }
        return s;
    }
}
