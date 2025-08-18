-- Create subscription tables for trials and paid periods
-- PostgreSQL dialect

CREATE TABLE IF NOT EXISTS restaurant_subscriptions (
    id                         BIGSERIAL PRIMARY KEY,
    restaurant_id              BIGINT       NOT NULL UNIQUE,
    plan                       VARCHAR(16)  NOT NULL DEFAULT 'PRO',
    status                     VARCHAR(16)  NOT NULL,
    trial_start_at             TIMESTAMP    NULL,
    trial_end_at               TIMESTAMP    NULL,
    current_period_start_at    TIMESTAMP    NULL,
    current_period_end_at      TIMESTAMP    NULL,
    cancel_at_period_end       BOOLEAN      NOT NULL DEFAULT FALSE,
    canceled_at                TIMESTAMP    NULL,
    created_at                 TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Status/Plan constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'restaurant_subscriptions_status_check'
    ) THEN
        ALTER TABLE restaurant_subscriptions
            ADD CONSTRAINT restaurant_subscriptions_status_check
            CHECK (status IN ('TRIALING','ACTIVE','GRACE','EXPIRED','CANCELED'));
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'restaurant_subscriptions_plan_check'
    ) THEN
        ALTER TABLE restaurant_subscriptions
            ADD CONSTRAINT restaurant_subscriptions_plan_check
            CHECK (plan IN ('PRO'));
    END IF;
END $$;

-- Foreign key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_restaurant_subscriptions_restaurant'
    ) THEN
        ALTER TABLE restaurant_subscriptions
            ADD CONSTRAINT fk_restaurant_subscriptions_restaurant
            FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_restaurant_subscriptions_status ON restaurant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_subscriptions_period_end ON restaurant_subscriptions(current_period_end_at);
CREATE INDEX IF NOT EXISTS idx_restaurant_subscriptions_trial_end ON restaurant_subscriptions(trial_end_at);


CREATE TABLE IF NOT EXISTS restaurant_subscription_events (
    id               BIGSERIAL PRIMARY KEY,
    subscription_id  BIGINT       NOT NULL,
    event_type       VARCHAR(32)  NOT NULL,
    metadata         TEXT         NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_subscription_events_subscription'
    ) THEN
        ALTER TABLE restaurant_subscription_events
            ADD CONSTRAINT fk_subscription_events_subscription
            FOREIGN KEY (subscription_id) REFERENCES restaurant_subscriptions(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscription_events_sub ON restaurant_subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON restaurant_subscription_events(event_type);
