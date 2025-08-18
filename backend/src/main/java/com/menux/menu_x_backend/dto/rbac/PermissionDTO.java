package com.menux.menu_x_backend.dto.rbac;

public class PermissionDTO {
    public String key;
    public String description;

    public PermissionDTO() {}
    public PermissionDTO(String key, String description) {
        this.key = key;
        this.description = description;
    }
}
