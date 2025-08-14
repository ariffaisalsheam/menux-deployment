-- Migration script to update Z.AI provider with correct model value
-- This ensures Z.AI providers show the actual model name instead of fallback values

-- Update existing Z.AI providers to have the correct model value
UPDATE ai_provider_configs 
SET model = 'glm-4.5-flash'
WHERE type = 'Z_AI_GLM_4_5' 
AND (model IS NULL OR model = '');

-- Add comment for documentation
COMMENT ON COLUMN ai_provider_configs.model IS 'AI model identifier (e.g., openai/gpt-4o, google/gemini-flash-1.5, glm-4.5-flash)';
