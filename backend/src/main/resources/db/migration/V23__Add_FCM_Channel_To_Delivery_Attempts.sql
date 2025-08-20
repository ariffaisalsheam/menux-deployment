-- Extend delivery_attempts.channel to include 'FCM'
-- Drop existing CHECK constraint by conventional name if present (works on Postgres & H2)
ALTER TABLE delivery_attempts DROP CONSTRAINT IF EXISTS delivery_attempts_channel_check;

-- Add new CHECK constraint with FCM included
ALTER TABLE delivery_attempts
    ADD CONSTRAINT delivery_attempts_channel_check
    CHECK (channel IN ('IN_APP','WEB_PUSH','EMAIL','SMS','FCM'));
