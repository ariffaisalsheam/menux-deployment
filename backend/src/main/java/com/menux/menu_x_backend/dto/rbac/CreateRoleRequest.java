package com.menux.menu_x_backend.dto.rbac;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateRoleRequest {
    @NotBlank
    @Size(max = 100)
    public String name;

    @Size(max = 255)
    public String description;
}
