package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.dto.audit.AuditLogDTO;
import com.menux.menu_x_backend.dto.common.PageResponse;
import com.menux.menu_x_backend.service.AdminAuditService;
import jakarta.validation.constraints.Min;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/audit")
@PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('PERM_VIEW_AUDIT_LOGS')")
public class AdminAuditController {

    @Autowired
    private AdminAuditService adminAuditService;

    @GetMapping({"", "/logs"})
    public ResponseEntity<PageResponse<AuditLogDTO>> list(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) Long actorId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        LocalDateTime fromDt = parseDateTime(from);
        LocalDateTime toDt = parseDateTime(to);
        Page<AuditLogDTO> result = adminAuditService.findLogs(action, resourceType, actorId, fromDt, toDt, pageable);
        return ResponseEntity.ok(PageResponse.from(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuditLogDTO> getById(@PathVariable("id") Long id) {
        return adminAuditService.getById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLog(@PathVariable Long id) {
        adminAuditService.deleteLog(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear-all")
    public ResponseEntity<Void> clearAllLogs() {
        adminAuditService.clearAllLogs();
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear-by-criteria")
    public ResponseEntity<Void> clearLogsByCriteria(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) Long actorId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        LocalDateTime fromDate = parseDateTime(from);
        LocalDateTime toDate = parseDateTime(to);

        adminAuditService.clearLogsByCriteria(action, resourceType, actorId, fromDate, toDate);
        return ResponseEntity.noContent().build();
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDateTime.parse(value);
        } catch (Exception ignored) {
            return null; // silently ignore bad format; caller can retry with ISO-8601
        }
    }
}
