package com.menux.menu_x_backend.dto.notifications;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterFcmTokenRequest {
    @NotBlank
    @Size(max = 4096)
    private String token;

    @Size(max = 128)
    private String deviceId;

    @Size(max = 128)
    private String platform; // ios | android | web

    @Size(max = 256)
    private String deviceModel;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getDeviceModel() {
        return deviceModel;
    }

    public void setDeviceModel(String deviceModel) {
        this.deviceModel = deviceModel;
    }
}
