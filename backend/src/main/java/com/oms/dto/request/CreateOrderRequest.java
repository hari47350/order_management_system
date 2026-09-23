package com.oms.dto.request;

import com.oms.entity.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateOrderRequest {

    @NotBlank(message = "Shipping address is required")
    private String shippingAddress;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    private String notes;

    // Payment gateway fields
    private String paymentIntentId;
    private String cardLast4;
    private String cardBrand;
    private String testPaymentRef;
}
