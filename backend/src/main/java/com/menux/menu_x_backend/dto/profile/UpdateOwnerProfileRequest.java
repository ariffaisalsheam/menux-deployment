package com.menux.menu_x_backend.dto.profile;

public class UpdateOwnerProfileRequest {
    public String fullName;
    public String phoneNumber;
    public String email;
    public String username;
    public Business business;

    public static class Business {
        public String name;
        public String address;
        public String phoneNumber;
        public String email;
        public String description;
    }
}
