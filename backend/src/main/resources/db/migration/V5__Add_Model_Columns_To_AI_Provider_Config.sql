-- Migration script to add model and model_display_name columns to ai_provider_configs table
-- This enables dynamic model selection for OpenRouter and other providers

-- Add model column for storing the AI model identifier
ALTER TABLE ai_provider_configs 
ADD COLUMN model VARCHAR(255);

-- Add model_display_name column for UI-friendly model names
ALTER TABLE ai_provider_configs 
ADD COLUMN model_display_name VARCHAR(255);

-- Add provider_id column for stable identifiers (if not exists)
ALTER TABLE ai_provider_configs 
ADD COLUMN provider_id VARCHAR(64);

-- Add comments for documentation
COMMENT ON COLUMN ai_provider_configs.model IS 'AI model identifier (e.g., openai/gpt-4o, google/gemini-flash-1.5)';
COMMENT ON COLUMN ai_provider_configs.model_display_name IS 'UI-friendly display name for the model';
COMMENT ON COLUMN ai_provider_configs.provider_id IS 'Stable identifier for custom providers';

-- Create index for model lookups
CREATE INDEX idx_ai_provider_configs_model ON ai_provider_configs(model);
