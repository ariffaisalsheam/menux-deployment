package com.menux.menu_x_backend.dto.notifications;

public class UpdatePreferencesRequest {
    private Boolean inAppEnabled;
    private Boolean webPushEnabled;
    private Boolean emailEnabled;
    private Boolean smsEnabled;
    private String overrides; // JSON string

    public Boolean getInAppEnabled() { return inAppEnabled; }
    public void setInAppEnabled(Boolean inAppEnabled) { this.inAppEnabled = inAppEnabled; }
    public Boolean getWebPushEnabled() { return webPushEnabled; }
    public void setWebPushEnabled(Boolean webPushEnabled) { this.webPushEnabled = webPushEnabled; }
    public Boolean getEmailEnabled() { return emailEnabled; }
    public void setEmailEnabled(Boolean emailEnabled) { this.emailEnabled = emailEnabled; }
    public Boolean getSmsEnabled() { return smsEnabled; }
    public void setSmsEnabled(Boolean smsEnabled) { this.smsEnabled = smsEnabled; }
    public String getOverrides() { return overrides; }
    public void setOverrides(String overrides) { this.overrides = overrides; }
}
