package com.menux.menu_x_backend.dto.subscription;

import com.menux.menu_x_backend.entity.RestaurantSubscriptionEvent;

public class RestaurantSubscriptionEventDTO {
    public Long id;
    public Long subscriptionId;
    public String eventType;
    public String metadata;
    public String createdAt;

    public static RestaurantSubscriptionEventDTO from(RestaurantSubscriptionEvent e) {
        RestaurantSubscriptionEventDTO d = new RestaurantSubscriptionEventDTO();
        d.id = e.getId();
        d.subscriptionId = e.getSubscriptionId();
        d.eventType = e.getEventType();
        d.metadata = e.getMetadata();
        d.createdAt = e.getCreatedAt() == null ? null : e.getCreatedAt().toString();
        return d;
    }
}
