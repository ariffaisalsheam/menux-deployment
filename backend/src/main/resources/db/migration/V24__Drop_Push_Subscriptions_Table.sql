-- Deprecation cleanup: Remove legacy Web Push subscription storage
-- Safe for Postgres and H2

-- Drop legacy Web Push table if it still exists
DROP TABLE IF EXISTS push_subscriptions;

-- Note:
-- We intentionally keep WEB_PUSH as an allowed value in delivery_attempts.channel
-- to preserve historical audit rows. No new WEB_PUSH attempts will be written.
