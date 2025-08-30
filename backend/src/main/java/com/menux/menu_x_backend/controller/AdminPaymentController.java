package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.dto.payments.AdminDecisionRequest;
import com.menux.menu_x_backend.dto.payments.ManualPaymentDto;
import com.menux.menu_x_backend.entity.ManualPayment;
import com.menux.menu_x_backend.service.ManualPaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/payments")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminPaymentController {

    @Autowired
    private ManualPaymentService manualPaymentService;

    @GetMapping("/manual-bkash")
    public ResponseEntity<List<ManualPaymentDto>> listManualBkash(@RequestParam(value = "status", required = false) String status) {
        ManualPayment.Status st = null;
        if (status != null && !status.isBlank()) {
            try {
                st = ManualPayment.Status.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException ex) {
                // ignore, will act as null (all)
            }
        }
        List<ManualPaymentDto> list = manualPaymentService.adminList(st)
                .stream().map(ManualPaymentDto::from).toList();
        return ResponseEntity.ok(list);
    }

    @PostMapping("/manual-bkash/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable("id") Long id, @RequestBody(required = false) AdminDecisionRequest body) {
        try {
            String note = body != null ? body.getNote() : null;
            ManualPayment mp = manualPaymentService.approve(id, note);
            return ResponseEntity.ok(ManualPaymentDto.from(mp));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/manual-bkash/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable("id") Long id, @RequestBody(required = false) AdminDecisionRequest body) {
        try {
            String note = body != null ? body.getNote() : null;
            ManualPayment mp = manualPaymentService.reject(id, note);
            return ResponseEntity.ok(ManualPaymentDto.from(mp));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/pending-count")
    public ResponseEntity<Map<String, Long>> getPendingPaymentsCount() {
        try {
            List<ManualPayment> pendingPayments = manualPaymentService.adminList(ManualPayment.Status.PENDING);
            long count = pendingPayments.size();
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("count", 0L));
        }
    }
}
