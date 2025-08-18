package com.menux.menu_x_backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.menux.menu_x_backend.dto.approvals.ApprovalDTO;
import com.menux.menu_x_backend.entity.Approval;
import com.menux.menu_x_backend.entity.ApprovalStatus;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.repository.ApprovalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ApprovalsService {

    @Autowired
    private ApprovalRepository approvalRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuditService auditService;

    public List<ApprovalDTO> list(ApprovalStatus status) {
        List<Approval> approvals = (status == null)
                ? approvalRepository.findAllByOrderByCreatedAtDesc()
                : approvalRepository.findByStatusOrderByCreatedAtDesc(status);
        return approvals.stream().map(this::toDto).collect(Collectors.toList());
    }

    public Optional<ApprovalDTO> approve(Long id, User approver, String note) {
        return decide(id, approver, note, ApprovalStatus.APPROVED);
    }

    public Optional<ApprovalDTO> reject(Long id, User approver, String note) {
        return decide(id, approver, note, ApprovalStatus.REJECTED);
    }

    private Optional<ApprovalDTO> decide(Long id, User approver, String note, ApprovalStatus target) {
        return approvalRepository.findById(id).map(appr -> {
            if (appr.getStatus() != ApprovalStatus.PENDING) {
                throw new IllegalStateException("Approval already decided");
            }
            appr.setStatus(target);
            appr.setApprover(approver);
            if (note != null && !note.isBlank()) {
                appr.setReason(note.trim());
            }
            appr.setDecidedAt(LocalDateTime.now());
            approvalRepository.save(appr);

            auditService.log(
                    "APPROVAL_" + target.name(),
                    "APPROVAL",
                    String.valueOf(appr.getId()),
                    new AuditMetadata(note)
            );

            return toDto(appr);
        });
    }

    private ApprovalDTO toDto(Approval a) {
        ApprovalDTO dto = new ApprovalDTO();
        dto.id = a.getId();
        dto.type = a.getType();
        dto.status = a.getStatus().name();
        dto.requestedBy = (a.getRequestedBy() != null ? a.getRequestedBy().getId() : null);
        dto.approverId = (a.getApprover() != null ? a.getApprover().getId() : null);
        dto.reason = a.getReason();
        dto.payload = parseJson(a.getPayload());
        dto.createdAt = a.getCreatedAt();
        dto.decidedAt = a.getDecidedAt();
        return dto;
    }

    private Object parseJson(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            JsonNode node = objectMapper.readTree(json);
            return objectMapper.convertValue(node, Object.class);
        } catch (Exception e) {
            // fallback to raw string
            return json;
        }
    }

    private record AuditMetadata(String note) {}
}
