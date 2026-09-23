package com.oms.dto.response;

import com.oms.entity.PaymentMethod;
import com.oms.entity.PaymentStatus;
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
public class PaymentResponse {
    private Long id;
    private Long orderId;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private String transactionRef;
    private String gatewayPaymentIntentId;
    private String cardLast4;
    private String cardBrand;
    private String gatewayStatus;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
}
