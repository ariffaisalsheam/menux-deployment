-- Fix legacy subscription data that was created without proper expiration dates
-- This addresses the issue where users remain PRO after trial expiration

-- Step 1: Identify and fix ACTIVE subscriptions with NULL current_period_end_at
-- These are legacy subscriptions that never expire
UPDATE restaurant_subscriptions 
SET 
    status = 'EXPIRED',
    updated_at = NOW()
WHERE 
    status = 'ACTIVE' 
    AND current_period_end_at IS NULL
    AND trial_end_at IS NULL;

-- Step 2: Handle ACTIVE subscriptions that have trial_end_at but no current_period_end_at
-- These should be evaluated based on their trial status
UPDATE restaurant_subscriptions 
SET 
    status = CASE 
        WHEN trial_end_at < NOW() - INTERVAL '3 days' THEN 'EXPIRED'
        WHEN trial_end_at < NOW() THEN 'GRACE'
        ELSE status
    END,
    updated_at = NOW()
WHERE 
    status = 'ACTIVE' 
    AND current_period_end_at IS NULL
    AND trial_end_at IS NOT NULL;

-- Step 3: Update restaurant subscription plans to match expired subscriptions
UPDATE restaurants 
SET 
    subscription_plan = 'BASIC',
    updated_at = NOW()
FROM restaurant_subscriptions rs
WHERE 
    restaurants.id = rs.restaurant_id
    AND rs.status = 'EXPIRED'
    AND restaurants.subscription_plan = 'PRO';

-- Step 4: Create audit events for the changes made
INSERT INTO restaurant_subscription_events (subscription_id, event_type, metadata, created_at)
SELECT 
    rs.id,
    'LEGACY_DATA_FIXED',
    '{"reason":"Fixed legacy subscription without expiration date","migration":"V101"}',
    NOW()
FROM restaurant_subscriptions rs
WHERE rs.status = 'EXPIRED' 
    AND rs.updated_at >= NOW() - INTERVAL '1 minute';

-- Step 5: Add a check constraint to prevent future NULL end date issues for ACTIVE subscriptions
-- Note: This is commented out as it might be too restrictive for current business logic
-- ALTER TABLE restaurant_subscriptions 
-- ADD CONSTRAINT check_active_has_end_date 
-- CHECK (
--     status != 'ACTIVE' OR 
--     current_period_end_at IS NOT NULL OR 
--     trial_end_at IS NOT NULL
-- );
