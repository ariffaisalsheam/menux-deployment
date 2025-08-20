-- Create table to store Firebase Cloud Messaging device tokens per user
CREATE TABLE IF NOT EXISTS user_push_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    platform VARCHAR(20) CHECK (platform IN ('ios','android','web')),
    device_id VARCHAR(128),
    device_model VARCHAR(256),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    last_used_at TIMESTAMP,

    CONSTRAINT fk_user_push_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_active
    ON user_push_tokens(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_platform
    ON user_push_tokens(platform);
