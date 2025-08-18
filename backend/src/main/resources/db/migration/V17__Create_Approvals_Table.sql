-- Approvals table for workflow requests requiring super admin decisions

CREATE TABLE IF NOT EXISTS approvals (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('PENDING','APPROVED','REJECTED')),
    requested_by BIGINT NOT NULL,
    approver_id BIGINT,
    reason TEXT,
    payload JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decided_at TIMESTAMP,

    CONSTRAINT fk_approvals_requester FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_approvals_approver FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_approvals_status_created ON approvals(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approvals_requested_by ON approvals(requested_by);
CREATE INDEX IF NOT EXISTS idx_approvals_approver ON approvals(approver_id);
