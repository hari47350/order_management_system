package com.oms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentVerificationResult {
    private boolean verified;
    private String paymentIntentId;
    private BigDecimal amount;
    private String transactionRef;
    private String cardLast4;
    private String cardBrand;
    private String gatewayStatus;
    private String message;
}
