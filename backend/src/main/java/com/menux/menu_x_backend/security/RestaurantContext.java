package com.menux.menu_x_backend.security;

/**
 * Thread-local request-scoped holder for restaurant context extracted from JWT.
 * Keeps the current user's associated restaurant ID (if any) available without extra DB queries.
 */
public final class RestaurantContext {

    private static final ThreadLocal<Long> restaurantIdHolder = new ThreadLocal<>();

    private RestaurantContext() {}

    public static void setRestaurantId(Long restaurantId) {
        restaurantIdHolder.set(restaurantId);
    }

    public static Long getRestaurantId() {
        return restaurantIdHolder.get();
    }

    public static void clear() {
        restaurantIdHolder.remove();
    }
}


