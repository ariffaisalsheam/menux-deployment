-- Create platform_settings table for global admin configuration
-- This table stores key-value pairs for platform-wide settings

CREATE TABLE platform_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    value_type VARCHAR(20) NOT NULL DEFAULT 'STRING' CHECK (value_type IN ('STRING', 'INTEGER', 'BOOLEAN', 'DECIMAL', 'JSON')),
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_platform_settings_key ON platform_settings(setting_key);
CREATE INDEX idx_platform_settings_public ON platform_settings(is_public);
CREATE INDEX idx_platform_settings_system ON platform_settings(is_system);

-- Add comments for documentation
COMMENT ON TABLE platform_settings IS 'Global platform configuration settings managed by Super Admin';
COMMENT ON COLUMN platform_settings.setting_key IS 'Unique identifier for the setting (e.g., app.name, pricing.pro_plan_monthly)';
COMMENT ON COLUMN platform_settings.setting_value IS 'The value of the setting stored as text';
COMMENT ON COLUMN platform_settings.description IS 'Human-readable description of what this setting controls';
COMMENT ON COLUMN platform_settings.value_type IS 'Data type of the value for proper parsing (STRING, INTEGER, BOOLEAN, DECIMAL, JSON)';
COMMENT ON COLUMN platform_settings.is_public IS 'Whether this setting can be accessed by non-admin users via public API';
COMMENT ON COLUMN platform_settings.is_system IS 'Whether this is a system setting that should not be deleted';

-- Insert default system settings
INSERT INTO platform_settings (setting_key, setting_value, description, value_type, is_public, is_system) VALUES
('app.name', 'Menu.X', 'Application name displayed to users', 'STRING', TRUE, TRUE),
('app.version', '1.0.0', 'Current application version', 'STRING', TRUE, TRUE),
('app.maintenance_mode', 'false', 'Whether the application is in maintenance mode', 'BOOLEAN', FALSE, TRUE),
('pricing.pro_plan_monthly', '1500', 'Pro plan monthly price in BDT', 'INTEGER', TRUE, TRUE),
('features.registration_enabled', 'true', 'Whether new user registration is enabled', 'BOOLEAN', FALSE, TRUE),
('features.ai_enabled', 'true', 'Whether AI features are enabled globally', 'BOOLEAN', FALSE, TRUE),
('branding.show_powered_by', 'true', 'Whether to show "Powered by Menu.X" branding on Basic plan restaurants', 'BOOLEAN', FALSE, TRUE),
('limits.max_menu_items_basic', '50', 'Maximum menu items allowed for Basic plan restaurants', 'INTEGER', FALSE, TRUE),
('limits.max_menu_items_pro', '500', 'Maximum menu items allowed for Pro plan restaurants', 'INTEGER', FALSE, TRUE),
('limits.max_tables_basic', '10', 'Maximum tables allowed for Basic plan restaurants', 'INTEGER', FALSE, TRUE),
('limits.max_tables_pro', '100', 'Maximum tables allowed for Pro plan restaurants', 'INTEGER', FALSE, TRUE);
