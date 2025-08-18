-- Owner payment methods for billing (non-sensitive fields only)

CREATE TABLE IF NOT EXISTS owner_payment_methods (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('BKASH','CARD','CASH')),
    label VARCHAR(100),
    last4 VARCHAR(4),
    token_hash VARCHAR(255), -- opaque server-side token hash when applicable
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,

    CONSTRAINT fk_opm_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_opm_owner ON owner_payment_methods(owner_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_opm_owner_default ON owner_payment_methods(owner_id) WHERE is_default;
