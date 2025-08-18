package com.menux.menu_x_backend.dto.rbac;

import java.util.List;

public class RoleDTO {
    public Long id;
    public String name;
    public String description;
    public List<PermissionDTO> permissions;

    public RoleDTO() {}

    public RoleDTO(Long id, String name, String description, List<PermissionDTO> permissions) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.permissions = permissions;
    }
}
