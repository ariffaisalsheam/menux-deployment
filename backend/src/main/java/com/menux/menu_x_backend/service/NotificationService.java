package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.dto.notifications.NotificationDto;
import com.menux.menu_x_backend.dto.notifications.NotificationPreferenceDto;
import com.menux.menu_x_backend.dto.notifications.PushSubscriptionRequest;
import com.menux.menu_x_backend.dto.notifications.UpdatePreferencesRequest;
import com.menux.menu_x_backend.entity.Notification;
import com.menux.menu_x_backend.entity.NotificationPreference;
import com.menux.menu_x_backend.entity.PushSubscription;
import com.menux.menu_x_backend.repository.NotificationPreferenceRepository;
import com.menux.menu_x_backend.repository.NotificationRepository;
import com.menux.menu_x_backend.repository.PushSubscriptionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Map;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationPreferenceRepository preferenceRepository;

    @Autowired
    private PushSubscriptionRepository pushSubscriptionRepository;

    @Autowired
    private PushNotificationService pushNotificationService;

    public Page<NotificationDto> list(Long userId, boolean unreadOnly, Pageable pageable) {
        Page<Notification> page = unreadOnly
                ? notificationRepository.findByTargetUserIdAndReadAtIsNullOrderByCreatedAtDesc(userId, pageable)
                : notificationRepository.findByTargetUserIdOrderByCreatedAtDesc(userId, pageable);
        return page.map(NotificationDto::from);
    }

    public long unreadCount(Long userId) {
        return notificationRepository.countByTargetUserIdAndReadAtIsNull(userId);
    }

    @Transactional
    public boolean markRead(Long userId, Long notificationId) {
        Optional<Notification> opt = notificationRepository.findByIdAndTargetUserId(notificationId, userId);
        if (opt.isEmpty()) return false;
        Notification n = opt.get();
        if (n.getReadAt() == null) {
            n.setReadAt(LocalDateTime.now());
        }
        n.setStatus(Notification.Status.READ);
        notificationRepository.save(n);
        return true;
    }

    @Transactional
    public int markAllRead(Long userId) {
        List<Notification> unread = notificationRepository.findByTargetUserIdAndReadAtIsNull(userId);
        LocalDateTime now = LocalDateTime.now();
        for (Notification n : unread) {
            n.setReadAt(now);
            n.setStatus(Notification.Status.READ);
        }
        if (!unread.isEmpty()) {
            notificationRepository.saveAll(unread);
        }
        return unread.size();
    }

    /**
     * Create and persist a notification entry.
     */
    @Transactional
    public NotificationDto createNotification(
            Long targetUserId,
            Long restaurantId,
            Notification.Type type,
            String title,
            String body,
            String dataJson
    ) {
        Notification n = new Notification();
        n.setTargetUserId(targetUserId);
        n.setRestaurantId(restaurantId);
        n.setType(type);
        n.setTitle(title);
        n.setBody(body);
        n.setData(dataJson);
        n.setPriority(Notification.Priority.NORMAL);
        n.setStatus(Notification.Status.PENDING);
        Notification saved = notificationRepository.save(n);
        // Attempt Web Push delivery (non-blocking, best-effort)
        try {
            pushNotificationService.sendWebPushIfEnabled(saved);
        } catch (Exception ignored) {
        }
        return NotificationDto.from(saved);
    }

    /**
     * Overload that accepts a Map and converts to JSON.
     */
    @Transactional
    public NotificationDto createNotification(
            Long targetUserId,
            Long restaurantId,
            Notification.Type type,
            String title,
            String body,
            Map<String, Object> data
    ) {
        return createNotification(targetUserId, restaurantId, type, title, body, toJson(data));
    }

    private String toJson(Map<String, Object> data) {
        if (data == null) return null;
        try {
            return new ObjectMapper().writeValueAsString(data);
        } catch (JsonProcessingException e) {
            // Fallback to null if serialization fails; we don't want to block the notification.
            return null;
        }
    }

    @Transactional
    public NotificationPreferenceDto updatePreferences(Long userId, UpdatePreferencesRequest req) {
        NotificationPreference pref = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> {
                    NotificationPreference p = new NotificationPreference();
                    p.setUserId(userId);
                    return p;
                });
        if (req.getInAppEnabled() != null) pref.setInAppEnabled(req.getInAppEnabled());
        if (req.getWebPushEnabled() != null) pref.setWebPushEnabled(req.getWebPushEnabled());
        if (req.getEmailEnabled() != null) pref.setEmailEnabled(req.getEmailEnabled());
        if (req.getSmsEnabled() != null) pref.setSmsEnabled(req.getSmsEnabled());
        if (req.getOverrides() != null) pref.setOverrides(req.getOverrides());
        NotificationPreference saved = preferenceRepository.save(pref);
        return NotificationPreferenceDto.from(saved);
    }

    public NotificationPreferenceDto getPreferences(Long userId) {
        NotificationPreference pref = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> {
                    NotificationPreference p = new NotificationPreference();
                    p.setUserId(userId);
                    return p;
                });
        return NotificationPreferenceDto.from(pref);
    }

    @Transactional
    public PushSubscription registerPushSubscription(Long userId, PushSubscriptionRequest req) {
        PushSubscription sub = pushSubscriptionRepository.findByEndpoint(req.getEndpoint())
                .orElseGet(PushSubscription::new);
        sub.setEndpoint(req.getEndpoint());
        sub.setP256dh(req.getP256dh());
        sub.setAuth(req.getAuth());
        sub.setUserAgent(req.getUserAgent());
        sub.setIsActive(true);
        sub.setUserId(userId);
        return pushSubscriptionRepository.save(sub);
    }

    @Transactional
    public boolean removePushSubscription(Long userId, Long subscriptionId) {
        Optional<PushSubscription> opt = pushSubscriptionRepository.findByIdAndUserId(subscriptionId, userId);
        if (opt.isEmpty()) return false;
        PushSubscription sub = opt.get();
        sub.setIsActive(false);
        pushSubscriptionRepository.save(sub);
        return true;
    }
}
