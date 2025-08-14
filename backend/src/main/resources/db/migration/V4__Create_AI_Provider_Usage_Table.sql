-- Create table to store per-provider usage statistics
CREATE TABLE IF NOT EXISTS ai_provider_usage (
    id BIGSERIAL PRIMARY KEY,
    provider_id BIGINT NOT NULL,
    total_calls BIGINT NOT NULL DEFAULT 0,
    total_errors BIGINT NOT NULL DEFAULT 0,
    last_called_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_provider_usage_provider_id ON ai_provider_usage(provider_id);
