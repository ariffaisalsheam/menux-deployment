package com.menux.menu_x_backend.dto.payments;

import com.menux.menu_x_backend.entity.ManualPayment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ManualPaymentDto {
    public Long id;
    public Long ownerId;
    public Long restaurantId;
    public String method;
    public BigDecimal amount;
    public String currency;
    public String trxId;
    public String senderMsisdn;
    public String screenshotPath;
    public String status;
    public String note;
    public LocalDateTime createdAt;
    public LocalDateTime verifiedAt;
    public Long verifiedBy;

    public static ManualPaymentDto from(ManualPayment mp) {
        ManualPaymentDto dto = new ManualPaymentDto();
        dto.id = mp.getId();
        dto.ownerId = mp.getOwnerId();
        dto.restaurantId = mp.getRestaurantId();
        dto.method = mp.getMethod() != null ? mp.getMethod().name() : null;
        dto.amount = mp.getAmount();
        dto.currency = mp.getCurrency();
        dto.trxId = mp.getTrxId();
        dto.senderMsisdn = mp.getSenderMsisdn();
        dto.screenshotPath = mp.getScreenshotPath();
        dto.status = mp.getStatus() != null ? mp.getStatus().name() : null;
        dto.note = mp.getNote();
        dto.createdAt = mp.getCreatedAt();
        dto.verifiedAt = mp.getVerifiedAt();
        dto.verifiedBy = mp.getVerifiedBy();
        return dto;
    }
}
