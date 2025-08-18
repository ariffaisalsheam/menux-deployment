package com.menux.menu_x_backend.dto.approvals;

import java.time.LocalDateTime;

public class ApprovalDTO {
    public Long id;
    public String type;
    public String status; // PENDING | APPROVED | REJECTED
    public Long requestedBy; // user id
    public Long approverId; // user id or null
    public String reason; // optional note
    public Object payload; // JSON object or primitive
    public LocalDateTime createdAt;
    public LocalDateTime decidedAt;
}
