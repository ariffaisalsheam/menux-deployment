package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.entity.DeliveryAttempt;
import com.menux.menu_x_backend.entity.Notification;
import com.menux.menu_x_backend.repository.DeliveryAttemptRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Legacy Web Push service. Now deprecated and retained as a stub for backward references.
 */
@Service
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

    @Autowired
    private DeliveryAttemptRepository deliveryAttemptRepository;

    public PushNotificationService() { }

    @Transactional
    public void sendWebPushIfEnabled(Notification notification) {
        // Web Push is deprecated and disabled. Record a suppressed attempt for audit and return.
        try {
            recordAttempt(notification.getId(), DeliveryAttempt.Channel.WEB_PUSH, DeliveryAttempt.Status.SUPPRESSED,
                    null, null, "Web Push deprecated; channel disabled");
            if (log.isDebugEnabled()) {
                log.debug("Web Push deprecated; skipping delivery for notificationId={}", notification.getId());
            }
        } catch (Exception e) {
            log.warn("Web Push deprecated stub encountered an error: {}", e.getMessage());
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
}
