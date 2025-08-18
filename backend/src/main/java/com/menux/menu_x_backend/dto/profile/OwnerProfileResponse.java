package com.menux.menu_x_backend.dto.profile;

public class OwnerProfileResponse {
    public Long id;
    public String username;
    public String email;
    public String fullName;
    public String phoneNumber;
    public String photoPath;
    public RestaurantInfo restaurant;

    public static class RestaurantInfo {
        public Long id;
        public String name;
        public String address;
        public String phoneNumber;
        public String email;
        public String subscriptionPlan;
    }
}
