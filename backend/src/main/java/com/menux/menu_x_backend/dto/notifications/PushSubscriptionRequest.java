package com.menux.menu_x_backend.dto.notifications;

import jakarta.validation.constraints.NotBlank;

public class PushSubscriptionRequest {
    @NotBlank
    private String endpoint;
    @NotBlank
    private String p256dh;
    @NotBlank
    private String auth;
    private String userAgent;

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }
    public String getP256dh() { return p256dh; }
    public void setP256dh(String p256dh) { this.p256dh = p256dh; }
    public String getAuth() { return auth; }
    public void setAuth(String auth) { this.auth = auth; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
}
