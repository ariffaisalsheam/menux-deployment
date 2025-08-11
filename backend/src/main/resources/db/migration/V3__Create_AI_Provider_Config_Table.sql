-- Migration script for AI Provider Configuration table
-- This creates the table for managing multiple AI providers with encryption and fallback support

CREATE TABLE ai_provider_configs (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('GOOGLE_GEMINI', 'OPENROUTER', 'OPENAI', 'OPENAI_COMPATIBLE', 'Z_AI_GLM_4_5')),
    encrypted_api_key TEXT NOT NULL,
    endpoint TEXT,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    settings TEXT, -- JSON string for provider-specific settings
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_tested_at TIMESTAMP,
    test_status VARCHAR(20) CHECK (test_status IN ('PENDING', 'SUCCESS', 'FAILED', 'TIMEOUT')),
    test_error_message TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_ai_provider_configs_active ON ai_provider_configs(is_active);
CREATE INDEX idx_ai_provider_configs_primary ON ai_provider_configs(is_primary);
CREATE INDEX idx_ai_provider_configs_type ON ai_provider_configs(type);
CREATE INDEX idx_ai_provider_configs_created_at ON ai_provider_configs(created_at);

-- Ensure only one primary provider at a time
CREATE UNIQUE INDEX idx_ai_provider_configs_unique_primary 
ON ai_provider_configs(is_primary) 
WHERE is_primary = TRUE;

-- Add comments for documentation
COMMENT ON TABLE ai_provider_configs IS 'Configuration table for AI providers supporting multiple services with encryption and fallback';
COMMENT ON COLUMN ai_provider_configs.name IS 'Human-readable name for the AI provider configuration';
COMMENT ON COLUMN ai_provider_configs.type IS 'Type of AI provider (Gemini, OpenAI, etc.)';
COMMENT ON COLUMN ai_provider_configs.encrypted_api_key IS 'AES-256 encrypted API key for the provider';
COMMENT ON COLUMN ai_provider_configs.endpoint IS 'Custom endpoint URL for the provider (optional)';
COMMENT ON COLUMN ai_provider_configs.is_active IS 'Whether this provider is active and available for use';
COMMENT ON COLUMN ai_provider_configs.is_primary IS 'Whether this is the primary provider (only one allowed)';
COMMENT ON COLUMN ai_provider_configs.settings IS 'JSON string containing provider-specific configuration';
COMMENT ON COLUMN ai_provider_configs.test_status IS 'Status of the last connectivity test';
COMMENT ON COLUMN ai_provider_configs.test_error_message IS 'Error message from the last failed test';

-- Insert default configuration (commented out - to be configured by admin)
-- INSERT INTO ai_provider_configs (name, type, encrypted_api_key, is_active, is_primary) 
-- VALUES ('Default Gemini', 'GOOGLE_GEMINI', 'ENCRYPTED_KEY_HERE', TRUE, TRUE);
