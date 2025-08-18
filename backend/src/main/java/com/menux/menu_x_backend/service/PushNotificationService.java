package com.menux.menu_x_backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.menux.menu_x_backend.entity.DeliveryAttempt;
import com.menux.menu_x_backend.entity.Notification;
import com.menux.menu_x_backend.entity.NotificationPreference;
import com.menux.menu_x_backend.entity.PushSubscription;
import com.menux.menu_x_backend.repository.DeliveryAttemptRepository;
import com.menux.menu_x_backend.repository.NotificationPreferenceRepository;
import com.menux.menu_x_backend.repository.PushSubscriptionRepository;
import nl.martijndwars.webpush.PushService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.bouncycastle.jce.provider.BouncyCastleProvider;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.Security;
import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * PushNotificationService is responsible for delivering notifications via Web Push.
 *
 * Uses webpush-java library with VAPID keys from environment variables.
 */
@Service
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

    @Autowired
    private Environment env;

    @Autowired
    private NotificationPreferenceRepository preferenceRepository;

    @Autowired
    private PushSubscriptionRepository pushSubscriptionRepository;

    @Autowired
    private DeliveryAttemptRepository deliveryAttemptRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public PushNotificationService() {
        // Ensure BouncyCastle provider is available (idempotent)
        try {
            Security.addProvider(new BouncyCastleProvider());
        } catch (Throwable ignored) {
        }
    }

    @Transactional
    public void sendWebPushIfEnabled(Notification notification) {
        Long userId = notification.getTargetUserId();
        NotificationPreference pref = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> {
                    NotificationPreference p = new NotificationPreference();
                    p.setUserId(userId);
                    return p;
                });

        if (pref.getWebPushEnabled() == null || !pref.getWebPushEnabled()) {
            // Record suppressed attempt since user disabled Web Push
            recordAttempt(notification.getId(), DeliveryAttempt.Channel.WEB_PUSH, DeliveryAttempt.Status.SUPPRESSED,
                    null, null, "User has Web Push disabled");
            return;
        }

        String vapidPub = env.getProperty("VAPID_PUBLIC_KEY");
        String vapidPriv = env.getProperty("VAPID_PRIVATE_KEY");
        if (vapidPub != null) vapidPub = stripQuotes(vapidPub.trim()).replaceAll("\\s+", "");
        if (vapidPriv != null) vapidPriv = stripQuotes(vapidPriv.trim()).replaceAll("\\s+", "");
        String subject = env.getProperty("VAPID_SUBJECT", "mailto:support@menux.com");

        if (vapidPub == null || vapidPub.isBlank() || vapidPriv == null || vapidPriv.isBlank()) {
            recordAttempt(notification.getId(), DeliveryAttempt.Channel.WEB_PUSH, DeliveryAttempt.Status.SUPPRESSED,
                    null, null, "VAPID keys not configured");
            return;
        }

        // Basic format validation: URL-safe base64 characters only
        if (!vapidPub.matches("^[A-Za-z0-9_-]+$") || !vapidPriv.matches("^[A-Za-z0-9_-]+$")) {
            log.warn("VAPID key format invalid (contains non-base64url characters). Check environment variables.");
            recordAttempt(notification.getId(), DeliveryAttempt.Channel.WEB_PUSH, DeliveryAttempt.Status.SUPPRESSED,
                    null, null, "Invalid VAPID key format");
            return;
        }

        List<PushSubscription> subs = pushSubscriptionRepository.findByUserIdAndIsActiveTrue(userId);
        if (subs.isEmpty()) {
            recordAttempt(notification.getId(), DeliveryAttempt.Channel.WEB_PUSH, DeliveryAttempt.Status.SUPPRESSED,
                    null, null, "No active subscriptions");
            return;
        }

        // Prepare a basic payload (title/body + optional deep link)
        String payload = buildPayload(notification);

        for (PushSubscription sub : subs) {
            try {
                if (log.isDebugEnabled()) {
                    try {
                        String host = null;
                        try { host = URI.create(sub.getEndpoint()).getHost(); } catch (Exception ignore) {}
                        log.debug("Web Push debug: vapidPubLen={} subject={} endpointHost={}",
                                vapidPub != null ? vapidPub.length() : 0,
                                subject,
                                host);
                    } catch (Exception ignore) {}
                }
                // Build push service with VAPID keys
                PushService pushService = new PushService(vapidPub, vapidPriv, subject);

                // Build web push notification using subscription fields
                nl.martijndwars.webpush.Notification wpNotification = new nl.martijndwars.webpush.Notification(
                        sub.getEndpoint(),
                        sub.getP256dh(),
                        sub.getAuth(),
                        payload != null ? payload : "{}"
                );

                var response = pushService.send(wpNotification);
                int status = response.getStatusLine().getStatusCode();
                String statusStr = Integer.toString(status);
                String body = readBodyQuietly(response.getEntity() != null ? response.getEntity().getContent() : null);

                if (status == 201 || status == 202) {
                    log.info("Web Push delivered (status={}) endpoint={} notificationId={}", status, sub.getEndpoint(), notification.getId());
                    recordAttempt(notification.getId(), DeliveryAttempt.Channel.WEB_PUSH, DeliveryAttempt.Status.SENT,
                            null, statusStr, null);
                } else if (status == 404 || status == 410) {
                    // Subscription is no longer valid; deactivate
                    log.warn("Web Push endpoint invalid (status={}), deactivating subscription id={} endpoint={}", status, sub.getId(), sub.getEndpoint());
                    try {
                        sub.setIsActive(false);
                        pushSubscriptionRepository.save(sub);
                    } catch (Exception ignore) {}
                    recordAttempt(notification.getId(), DeliveryAttempt.Channel.WEB_PUSH, DeliveryAttempt.Status.FAILED,
                            null, statusStr, "Subscription expired or not found");
                } else {
                    log.warn("Web Push failed (status={}) endpoint={} body={}", status, sub.getEndpoint(), body);
                    recordAttempt(notification.getId(), DeliveryAttempt.Channel.WEB_PUSH, DeliveryAttempt.Status.FAILED,
                            null, statusStr, body);
                }
            } catch (GeneralSecurityException | IOException | org.jose4j.lang.JoseException | java.util.concurrent.ExecutionException | InterruptedException e) {
                log.warn("Web Push send error endpoint={} err={}", sub.getEndpoint(), e.getMessage());
                recordAttempt(notification.getId(), DeliveryAttempt.Channel.WEB_PUSH, DeliveryAttempt.Status.FAILED,
                        null, null, e.getMessage());
                // Restore interrupt status if interrupted
                if (e instanceof InterruptedException) {
                    Thread.currentThread().interrupt();
                }
            } catch (Exception e) {
                log.warn("Web Push unexpected error endpoint={} err={}", sub.getEndpoint(), e.getMessage());
                recordAttempt(notification.getId(), DeliveryAttempt.Channel.WEB_PUSH, DeliveryAttempt.Status.FAILED,
                        null, null, e.getMessage());
            }
        }
    }

    private String buildPayload(Notification n) {
        Map<String, Object> m = new HashMap<>();
        m.put("title", n.getTitle());
        m.put("body", n.getBody());
        // Pass through data field if present (should be JSON string)
        if (n.getData() != null && !n.getData().isBlank()) {
            try {
                Map<?, ?> parsed = objectMapper.readValue(n.getData(), Map.class);
                m.put("data", parsed);
            } catch (JsonProcessingException ignored) {
            }
        }
        try {
            return objectMapper.writeValueAsString(m);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private String readBodyQuietly(InputStream inputStream) {
        if (inputStream == null) return null;
        try (InputStream is = inputStream; InputStreamReader isr = new InputStreamReader(is, StandardCharsets.UTF_8); BufferedReader br = new BufferedReader(isr)) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) {
                sb.append(line);
            }
            return sb.toString();
        } catch (IOException e) {
            return null;
        }
    }

    private void recordAttempt(Long notificationId,
                               DeliveryAttempt.Channel channel,
                               DeliveryAttempt.Status status,
                               String providerMessageId,
                               String responseCode,
                               String errorMessage) {
        DeliveryAttempt a = new DeliveryAttempt();
        a.setNotificationId(notificationId);
        a.setChannel(channel);
        a.setStatus(status);
        a.setProviderMessageId(providerMessageId);
        a.setResponseCode(responseCode);
        a.setErrorMessage(errorMessage);
        deliveryAttemptRepository.save(a);
    }

    private static String stripQuotes(String s) {
        if (s == null || s.length() < 2) return s;
        if ((s.startsWith("\"") && s.endsWith("\"")) || (s.startsWith("'") && s.endsWith("'"))) {
            return s.substring(1, s.length() - 1);
        }
        return s;
    }
}
