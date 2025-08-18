package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.dto.payments.ManualBkashSubmitRequest;
import com.menux.menu_x_backend.dto.payments.ManualPaymentDto;
import com.menux.menu_x_backend.entity.ManualPayment;
import com.menux.menu_x_backend.service.ManualPaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@PreAuthorize("hasRole('RESTAURANT_OWNER')")
public class PaymentController {

    @Autowired
    private ManualPaymentService manualPaymentService;

    @PostMapping("/manual-bkash")
    public ResponseEntity<?> submitManualBkash(@RequestBody ManualBkashSubmitRequest req) {
        try {
            ManualPayment mp = manualPaymentService.submitManualBkash(
                    req.getAmount(),
                    req.getTrxId(),
                    req.getSenderMsisdn(),
                    req.getScreenshotPath()
            );
            return ResponseEntity.ok(ManualPaymentDto.from(mp));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<List<ManualPaymentDto>> listMyPayments() {
        List<ManualPaymentDto> list = manualPaymentService.listMyPayments()
                .stream().map(ManualPaymentDto::from).toList();
        return ResponseEntity.ok(list);
    }
}
