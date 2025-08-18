package com.menux.menu_x_backend.dto.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdatePasswordRequest {
    @NotBlank
    public String currentPassword;

    @NotBlank
    @Size(min = 6)
    public String newPassword;
}
