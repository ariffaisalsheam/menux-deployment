-- Notifications core tables for in-app and multi-channel delivery

-- 1) notifications: persisted user-visible notifications
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    target_user_id BIGINT,
    restaurant_id BIGINT,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'NEW_ORDER', 'FEEDBACK_RECEIVED', 'ITEM_OUT_OF_STOCK', 'TABLE_CALLED', 'GENERIC'
    )),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    priority VARCHAR(10) NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW','NORMAL','HIGH')),
    status VARCHAR(10) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','READ','FAILED')),
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,

    CONSTRAINT fk_notifications_target_user
        FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_notifications_restaurant
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_notifications_target_status_created
    ON notifications(target_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_restaurant_created
    ON notifications(restaurant_id, created_at DESC);


-- 2) notification_preferences: per-user channel toggles and overrides
CREATE TABLE IF NOT EXISTS notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    web_push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    overrides JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,

    CONSTRAINT fk_notification_prefs_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 3) push_subscriptions: Web Push endpoints per user/device
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    last_used_at TIMESTAMP,

    CONSTRAINT fk_push_subscriptions_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
    ON push_subscriptions(user_id);


-- 4) delivery_attempts: channel delivery audit and retries
CREATE TABLE IF NOT EXISTS delivery_attempts (
    id BIGSERIAL PRIMARY KEY,
    notification_id BIGINT NOT NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('IN_APP','WEB_PUSH','EMAIL','SMS')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING','SENT','FAILED','RETRY','SUPPRESSED')),
    provider_message_id VARCHAR(255),
    response_code VARCHAR(50),
    error_message TEXT,
    attempt_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    retry_count INT NOT NULL DEFAULT 0,

    CONSTRAINT fk_delivery_attempts_notification
        FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_delivery_attempts_notification
    ON delivery_attempts(notification_id);
CREATE INDEX IF NOT EXISTS idx_delivery_attempts_channel_status_time
    ON delivery_attempts(channel, status, attempt_at DESC);
