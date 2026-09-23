package com.oms.dto.request;

import com.oms.entity.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentConfirmRequest {

    @NotBlank(message = "Payment Intent ID is required")
    private String paymentIntentId;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    private String cardLast4;

    private String cardBrand;

    private String upiVpa;
}
