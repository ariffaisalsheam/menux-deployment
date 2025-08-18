package com.menux.menu_x_backend.dto.profile;

import jakarta.validation.constraints.NotBlank;

public class SetProfilePhotoRequest {
    @NotBlank
    public String path;
}
