-- Fix subscription schema mismatches and add missing status values
-- This migration addresses critical issues in the subscription system

-- Step 1: Add BASIC plan support to restaurant_subscriptions table
DO $$
BEGIN
    -- Drop existing plan constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'restaurant_subscriptions_plan_check'
    ) THEN
        ALTER TABLE restaurant_subscriptions DROP CONSTRAINT restaurant_subscriptions_plan_check;
    END IF;
    
    -- Add new plan constraint that includes BASIC
    ALTER TABLE restaurant_subscriptions
        ADD CONSTRAINT restaurant_subscriptions_plan_check
        CHECK (plan IN ('BASIC', 'PRO'));
END $$;

-- Step 2: Add SUSPENDED status support
DO $$
BEGIN
    -- Drop existing status constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'restaurant_subscriptions_status_check'
    ) THEN
        ALTER TABLE restaurant_subscriptions DROP CONSTRAINT restaurant_subscriptions_status_check;
    END IF;
    
    -- Add new status constraint that includes SUSPENDED
    ALTER TABLE restaurant_subscriptions
        ADD CONSTRAINT restaurant_subscriptions_status_check
        CHECK (status IN ('TRIALING','ACTIVE','GRACE','EXPIRED','CANCELED','SUSPENDED'));
END $$;

-- Step 3: Add grace_end_at column for better grace period tracking
ALTER TABLE restaurant_subscriptions 
ADD COLUMN IF NOT EXISTS grace_end_at TIMESTAMP NULL;

-- Step 4: Create index for grace_end_at for efficient queries
CREATE INDEX IF NOT EXISTS idx_restaurant_subscriptions_grace_end ON restaurant_subscriptions(grace_end_at);

-- Step 5: Migrate existing data to ensure consistency
-- Set default subscription records for restaurants that don't have them
INSERT INTO restaurant_subscriptions (restaurant_id, plan, status, created_at, updated_at)
SELECT 
    r.id,
    CASE 
        WHEN r.subscription_plan = 'PRO' THEN 'PRO'::VARCHAR(16)
        ELSE 'BASIC'::VARCHAR(16)
    END,
    CASE 
        WHEN r.subscription_plan = 'PRO' THEN 'ACTIVE'::VARCHAR(16)
        ELSE 'EXPIRED'::VARCHAR(16)
    END,
    NOW(),
    NOW()
FROM restaurants r
WHERE NOT EXISTS (
    SELECT 1 FROM restaurant_subscriptions rs WHERE rs.restaurant_id = r.id
)
ON CONFLICT (restaurant_id) DO NOTHING;

-- Step 6: Sync existing subscription records with restaurant subscription_plan
UPDATE restaurant_subscriptions rs
SET 
    plan = CASE 
        WHEN r.subscription_plan = 'PRO' THEN 'PRO'::VARCHAR(16)
        ELSE 'BASIC'::VARCHAR(16)
    END,
    updated_at = NOW()
FROM restaurants r
WHERE rs.restaurant_id = r.id
    AND rs.plan != CASE 
        WHEN r.subscription_plan = 'PRO' THEN 'PRO'::VARCHAR(16)
        ELSE 'BASIC'::VARCHAR(16)
    END;

-- Step 7: Create audit event for schema migration
INSERT INTO restaurant_subscription_events (subscription_id, event_type, metadata, created_at)
SELECT 
    rs.id,
    'SCHEMA_MIGRATION',
    '{"migration":"V102","description":"Fixed schema mismatches and added BASIC plan support"}',
    NOW()
FROM restaurant_subscriptions rs;
