package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.dto.approvals.ApprovalDTO;
import com.menux.menu_x_backend.dto.payments.AdminDecisionRequest;
import com.menux.menu_x_backend.entity.ApprovalStatus;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.service.ApprovalsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/approvals")
@PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('PERM_MANAGE_APPROVALS')")
public class AdminApprovalsController {

    @Autowired
    private ApprovalsService approvalsService;

    @GetMapping
    public ResponseEntity<List<ApprovalDTO>> list(@RequestParam(required = false) String status) {
        ApprovalStatus st = null;
        if (status != null && !status.isBlank()) {
            try { st = ApprovalStatus.valueOf(status.toUpperCase()); }
            catch (IllegalArgumentException ex) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status"); }
        }
        return ResponseEntity.ok(approvalsService.list(st));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApprovalDTO> approve(@PathVariable("id") Long id, @RequestBody(required = false) AdminDecisionRequest body) {
        User approver = requireCurrentUser();
        try {
            return approvalsService.approve(id, approver, body != null ? body.getNote() : null)
                    .map(ResponseEntity::ok)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApprovalDTO> reject(@PathVariable("id") Long id, @RequestBody(required = false) AdminDecisionRequest body) {
        User approver = requireCurrentUser();
        try {
            return approvalsService.reject(id, approver, body != null ? body.getNote() : null)
                    .map(ResponseEntity::ok)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    private User requireCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return (User) auth.getPrincipal();
    }
}
