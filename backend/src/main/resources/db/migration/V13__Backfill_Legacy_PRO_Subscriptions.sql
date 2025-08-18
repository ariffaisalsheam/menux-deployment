-- Backfill legacy PRO restaurants into restaurant_subscriptions
-- Restaurants that already have PRO plan but no subscription row will get an ACTIVE subscription with unknown period end.

INSERT INTO restaurant_subscriptions (
    restaurant_id,
    plan,
    status,
    trial_start_at,
    trial_end_at,
    current_period_start_at,
    current_period_end_at,
    cancel_at_period_end,
    canceled_at,
    created_at,
    updated_at
)
SELECT r.id, 'PRO', 'ACTIVE', NULL, NULL, NOW(), NULL, FALSE, NULL, NOW(), NOW()
FROM restaurants r
LEFT JOIN restaurant_subscriptions s ON s.restaurant_id = r.id
WHERE r.subscription_plan = 'PRO'
  AND s.id IS NULL;
