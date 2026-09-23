package com.oms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentIntentResponse {

    private String paymentIntentId;
    private String clientSecret;
    private BigDecimal amount;
    private String currency;
    private String publishableKey;
    private String gatewayProvider; // "STRIPE" or "SANDBOX"
    private String status;
    private String qrCodeData;
    private LocalDateTime createdAt;
}
