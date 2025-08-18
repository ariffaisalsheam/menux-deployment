-- Invoices for owner billing history

CREATE TABLE IF NOT EXISTS invoices (
    id BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('PAID','DUE','VOID')),
    method VARCHAR(20),
    reference VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,

    CONSTRAINT fk_invoices_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invoices_restaurant_created ON invoices(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
