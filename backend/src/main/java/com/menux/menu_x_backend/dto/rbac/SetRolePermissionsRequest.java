package com.menux.menu_x_backend.dto.rbac;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public class SetRolePermissionsRequest {
    @NotNull
    public List<String> permissionKeys;
}
