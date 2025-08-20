package com.menux.menu_x_backend.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.AndroidConfig;
import com.google.firebase.messaging.ApnsConfig;
import com.google.firebase.messaging.Aps;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.MessagingErrorCode;
import com.google.firebase.messaging.Message;
import com.menux.menu_x_backend.dto.notifications.RegisterFcmTokenRequest;
import com.menux.menu_x_backend.entity.DeliveryAttempt;
import com.menux.menu_x_backend.entity.Notification;
import com.menux.menu_x_backend.entity.UserPushToken;
import com.menux.menu_x_backend.repository.DeliveryAttemptRepository;
import com.menux.menu_x_backend.repository.UserPushTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;

@Service
public class FcmService {
    private static final Logger log = LoggerFactory.getLogger(FcmService.class);

    @Value("${app.notifications.features.fcm:false}")
    private boolean fcmEnabled;

    @Autowired
    private UserPushTokenRepository userPushTokenRepository;

    @Autowired
    private DeliveryAttemptRepository deliveryAttemptRepository;

    @Transactional
    public void registerUserToken(Long userId, RegisterFcmTokenRequest req) {
        if (!fcmEnabled) {
            log.info("FCM disabled; accepting token registration for userId={} but not persisting", userId);
            return;
        }
        final String token = req.getToken().trim();
        final String platform = normalizePlatform(req.getPlatform());
        final String deviceId = trimOrNull(req.getDeviceId());
        final String deviceModel = trimOrNull(req.getDeviceModel());
        userPushTokenRepository.findByToken(token)
                .ifPresentOrElse(existing -> {
                    existing.setUserId(userId);
                    existing.setPlatform(platform);
                    existing.setDeviceId(deviceId);
                    existing.setDeviceModel(deviceModel);
                    existing.setIsActive(true);
                    existing.setLastUsedAt(LocalDateTime.now());
                    userPushTokenRepository.save(existing);
                }, () -> {
                    UserPushToken t = new UserPushToken();
                    t.setUserId(userId);
                    t.setToken(token);
                    t.setPlatform(platform);
                    t.setDeviceId(deviceId);
                    t.setDeviceModel(deviceModel);
                    t.setIsActive(true);
                    t.setLastUsedAt(LocalDateTime.now());
                    userPushTokenRepository.save(t);
                });
        log.info("[FCM] registered token userId={} platform={} deviceId={} model={} tokenHash={}...",
                userId, platform, deviceId, deviceModel, hash(token));
    }

    @Transactional
    public void removeUserToken(Long userId, String token) {
        if (!fcmEnabled) {
            log.info("FCM disabled; accepting token removal for userId={} but not persisting", userId);
            return;
        }
        final String tk = token == null ? null : token.trim();
        if (tk == null || tk.isEmpty()) {
            log.info("[FCM] remove token called with empty token for userId={}", userId);
            return;
        }
        userPushTokenRepository.findByUserIdAndToken(userId, tk)
                .ifPresent(t -> {
                    t.setIsActive(false);
                    userPushTokenRepository.save(t);
                });
        // If not found under this user, try by token (device may be reassigned)
        userPushTokenRepository.findByToken(tk)
                .ifPresent(t -> {
                    t.setIsActive(false);
                    userPushTokenRepository.save(t);
                });
        log.info("[FCM] removed token userId={} tokenHash={}...", userId, hash(tk));
    }

    public void sendIfEnabled(Notification n) {
        if (!fcmEnabled) return;
        if (n.getTargetUserId() == null) return;
        // If Firebase is not initialized (e.g., missing credentials), skip gracefully
        if (FirebaseApp.getApps().isEmpty()) {
            log.info("[FCM] Firebase not initialized; skipping send for notifId={}", n.getId());
            return;
        }
        List<UserPushToken> tokens = userPushTokenRepository.findByUserIdAndIsActiveTrue(n.getTargetUserId());
        if (tokens.isEmpty()) return;

        for (UserPushToken t : tokens) {
            DeliveryAttempt attempt = new DeliveryAttempt();
            attempt.setNotificationId(n.getId());
            attempt.setChannel(DeliveryAttempt.Channel.FCM);
            attempt.setStatus(DeliveryAttempt.Status.PENDING);
            attempt = deliveryAttemptRepository.save(attempt);

            try {
                Message msg = buildMessage(n, t.getToken());
                String messageId = FirebaseMessaging.getInstance().send(msg);
                attempt.setStatus(DeliveryAttempt.Status.SENT);
                attempt.setProviderMessageId(messageId);
                deliveryAttemptRepository.save(attempt);
                // Update token last used timestamp on successful delivery
                try {
                    t.setLastUsedAt(LocalDateTime.now());
                    userPushTokenRepository.save(t);
                } catch (Exception ignored) {
                    // non-fatal
                }
            } catch (FirebaseMessagingException fme) {
                log.warn("[FCM] send failed (FME) notifId={} tokenHash={} code={} msg={}",
                        n.getId(), hash(t.getToken()), fme.getMessagingErrorCode(), fme.getMessage());
                attempt.setStatus(DeliveryAttempt.Status.FAILED);
                attempt.setErrorMessage(fme.getMessage());
                MessagingErrorCode code = fme.getMessagingErrorCode();
                attempt.setResponseCode(code != null ? code.name() : null);
                deliveryAttemptRepository.save(attempt);
                // Deactivate tokens that are clearly invalid to avoid repeated failures
                if (code == MessagingErrorCode.UNREGISTERED || code == MessagingErrorCode.INVALID_ARGUMENT) {
                    try {
                        t.setIsActive(false);
                        userPushTokenRepository.save(t);
                    } catch (Exception ignored) {
                        // non-fatal
                    }
                }
            } catch (Exception e) {
                log.warn("[FCM] send failed notifId={} tokenHash={} err={}", n.getId(), hash(t.getToken()), e.getMessage());
                attempt.setStatus(DeliveryAttempt.Status.FAILED);
                attempt.setErrorMessage(e.getMessage());
                deliveryAttemptRepository.save(attempt);
            }
        }
    }

    private Message buildMessage(Notification n, String token) {
        // Basic notification payload; data kept minimal and string-only
        com.google.firebase.messaging.Notification notification = com.google.firebase.messaging.Notification
                .builder()
                .setTitle(n.getTitle())
                .setBody(n.getBody())
                .build();

        Map<String, String> data = new HashMap<>();
        data.put("notificationId", String.valueOf(n.getId()));
        if (n.getRestaurantId() != null) data.put("restaurantId", String.valueOf(n.getRestaurantId()));
        if (n.getType() != null) data.put("type", n.getType().name());
        if (n.getPriority() != null) data.put("priority", n.getPriority().name());

        return Message.builder()
                .setToken(token)
                .setNotification(notification)
                .putAllData(data)
                .setAndroidConfig(AndroidConfig.builder().setPriority(AndroidConfig.Priority.HIGH).build())
                .setApnsConfig(ApnsConfig.builder().setAps(Aps.builder().setThreadId("menux").build()).build())
                .build();
    }

    private String hash(String s) {
        if (s == null) return "null";
        int h = s.hashCode();
        return Integer.toHexString(h);
    }

    private String normalizePlatform(String p) {
        if (p == null) return null;
        String v = p.trim().toLowerCase();
        if (v.equals("ios") || v.equals("android") || v.equals("web")) return v;
        return null; // fallback to null to satisfy DB CHECK
    }

    private String trimOrNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
