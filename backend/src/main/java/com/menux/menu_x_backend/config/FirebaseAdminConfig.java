package com.menux.menu_x_backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Configuration
public class FirebaseAdminConfig {
    private static final Logger log = LoggerFactory.getLogger(FirebaseAdminConfig.class);

    @Value("${app.notifications.features.fcm:false}")
    private boolean fcmEnabled;

    @Value("${app.firebase.admin.service-account-json:}")
    private String serviceAccountJson;

    @Value("${app.firebase.admin.service-account-json-base64:}")
    private String serviceAccountJsonBase64;

    @PostConstruct
    public void init() {
        if (!fcmEnabled) {
            log.info("FCM disabled by feature flag; skipping Firebase initialization");
            return;
        }
        if (!FirebaseApp.getApps().isEmpty()) {
            log.info("FirebaseApp already initialized; skipping");
            return;
        }
        String json = resolveServiceAccountJson();
        if (json == null || json.isBlank()) {
            log.warn("FCM enabled but no service account JSON provided; skipping Firebase initialization");
            return;
        }
        try (ByteArrayInputStream bais = new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8))) {
            GoogleCredentials credentials = GoogleCredentials.fromStream(bais);
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build();
            FirebaseApp.initializeApp(options);
            log.info("FirebaseApp initialized for FCM");
        } catch (IOException e) {
            log.error("Failed to initialize FirebaseApp: {}", e.getMessage());
        }
    }

    private String resolveServiceAccountJson() {
        if (serviceAccountJson != null && !serviceAccountJson.isBlank()) {
            return serviceAccountJson.trim();
        }
        if (serviceAccountJsonBase64 != null && !serviceAccountJsonBase64.isBlank()) {
            try {
                byte[] decoded = Base64.getDecoder().decode(serviceAccountJsonBase64.trim());
                return new String(decoded, StandardCharsets.UTF_8);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid base64 for service-account-json-base64: {}", e.getMessage());
            }
        }
        return null;
    }
}
