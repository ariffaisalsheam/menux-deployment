package com.menux.menu_x_backend.dto.payments;

import java.math.BigDecimal;

public class ManualBkashSubmitRequest {
    private BigDecimal amount;
    private String trxId;
    private String senderMsisdn;
    private String screenshotPath; // path from MediaController upload

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getTrxId() { return trxId; }
    public void setTrxId(String trxId) { this.trxId = trxId; }

    public String getSenderMsisdn() { return senderMsisdn; }
    public void setSenderMsisdn(String senderMsisdn) { this.senderMsisdn = senderMsisdn; }

    public String getScreenshotPath() { return screenshotPath; }
    public void setScreenshotPath(String screenshotPath) { this.screenshotPath = screenshotPath; }
}
