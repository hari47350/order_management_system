package com.oms.dto.request;

import com.oms.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentIntentRequest {

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    private String currency; // Defaults to "usd"
}
