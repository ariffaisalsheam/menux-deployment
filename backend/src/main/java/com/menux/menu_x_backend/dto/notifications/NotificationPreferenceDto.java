package com.menux.menu_x_backend.dto.notifications;

import com.menux.menu_x_backend.entity.NotificationPreference;

public class NotificationPreferenceDto {
    private Boolean inAppEnabled;
    private Boolean webPushEnabled;
    private Boolean emailEnabled;
    private Boolean smsEnabled;
    private String overrides;

    public static NotificationPreferenceDto from(NotificationPreference p) {
        NotificationPreferenceDto dto = new NotificationPreferenceDto();
        dto.inAppEnabled = p.getInAppEnabled();
        dto.webPushEnabled = p.getWebPushEnabled();
        dto.emailEnabled = p.getEmailEnabled();
        dto.smsEnabled = p.getSmsEnabled();
        dto.overrides = p.getOverrides();
        return dto;
    }

    public Boolean getInAppEnabled() { return inAppEnabled; }
    public Boolean getWebPushEnabled() { return webPushEnabled; }
    public Boolean getEmailEnabled() { return emailEnabled; }
    public Boolean getSmsEnabled() { return smsEnabled; }
    public String getOverrides() { return overrides; }
}
