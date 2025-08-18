-- Create manual_payments table for manual bKash submissions
-- PostgreSQL dialect

CREATE TABLE IF NOT EXISTS manual_payments (
    id               BIGSERIAL PRIMARY KEY,
    owner_id         BIGINT       NOT NULL,
    restaurant_id    BIGINT       NOT NULL,
    method           VARCHAR(32)  NOT NULL DEFAULT 'BKASH',
    amount           NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    currency         VARCHAR(8)   NOT NULL DEFAULT 'BDT',
    trx_id           VARCHAR(64)  NOT NULL UNIQUE,
    sender_msisdn    VARCHAR(32)  NOT NULL,
    screenshot_path  TEXT         NULL,
    status           VARCHAR(16)  NOT NULL,
    note             TEXT         NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    verified_at      TIMESTAMP    NULL,
    verified_by      BIGINT       NULL
);

-- Status values constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'manual_payments_status_check'
    ) THEN
        ALTER TABLE manual_payments
            ADD CONSTRAINT manual_payments_status_check
            CHECK (status IN ('PENDING','APPROVED','REJECTED'));
    END IF;
END $$;

-- Foreign keys (best-effort, tables exist in production DB)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_manual_payments_owner'
    ) THEN
        ALTER TABLE manual_payments
            ADD CONSTRAINT fk_manual_payments_owner
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_manual_payments_restaurant'
    ) THEN
        ALTER TABLE manual_payments
            ADD CONSTRAINT fk_manual_payments_restaurant
            FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_manual_payments_status_created_at
    ON manual_payments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manual_payments_restaurant
    ON manual_payments(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_owner
    ON manual_payments(owner_id);
