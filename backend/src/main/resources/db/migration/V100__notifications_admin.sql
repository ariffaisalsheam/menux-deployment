-- Notifications Admin schema (templates, segments, campaigns)
-- Safe for Postgres; uses IF NOT EXISTS guards

-- 1) notification_templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  channel VARCHAR(20) NOT NULL,
  title VARCHAR(255),
  body TEXT NOT NULL,
  variables JSONB,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP
);

-- 2) notification_segments
CREATE TABLE IF NOT EXISTS notification_segments (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  filters JSONB,
  estimated_count INTEGER,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP
);

-- 3) notification_campaigns
CREATE TABLE IF NOT EXISTS notification_campaigns (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  template_id BIGINT NOT NULL,
  segment_id BIGINT NOT NULL,
  schedule_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP,
  CONSTRAINT fk_campaign_template FOREIGN KEY (template_id)
    REFERENCES notification_templates(id) ON DELETE RESTRICT,
  CONSTRAINT fk_campaign_segment FOREIGN KEY (segment_id)
    REFERENCES notification_segments(id) ON DELETE RESTRICT
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_notification_campaigns_status ON notification_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_notification_campaigns_schedule_at ON notification_campaigns(schedule_at);
