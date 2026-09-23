package com.oms.controller;

import com.oms.dto.request.PaymentConfirmRequest;
import com.oms.dto.request.PaymentIntentRequest;
import com.oms.dto.response.CartResponse;
import com.oms.dto.response.PaymentIntentResponse;
import com.oms.dto.response.PaymentResponse;
import com.oms.dto.response.PaymentVerificationResult;
import com.oms.entity.User;
import com.oms.exception.BadRequestException;
import com.oms.service.AuthService;
import com.oms.service.CartService;
import com.oms.service.PaymentGatewayService;
import com.oms.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment gateway, intent creation, and inspection endpoints")
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentGatewayService paymentGatewayService;
    private final CartService cartService;
    private final AuthService authService;

    @PostMapping("/create-intent")
    @Operation(summary = "Create a Payment Intent with Stripe / Gateway for current cart")
    public ResponseEntity<PaymentIntentResponse> createPaymentIntent(@Valid @RequestBody PaymentIntentRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        CartResponse cart = cartService.getCartResponse(user);

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new BadRequestException("Your cart is empty. Please add items before initiating payment.");
        }

        return ResponseEntity.ok(paymentGatewayService.createPaymentIntent(
                user,
                cart.getSubtotal(),
                request.getPaymentMethod(),
                request.getCurrency()
        ));
    }

    @PostMapping("/confirm")
    @Operation(summary = "Confirm/authorize a Payment Intent with gateway")
    public ResponseEntity<PaymentVerificationResult> confirmPayment(@Valid @RequestBody PaymentConfirmRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(paymentGatewayService.confirmPayment(user, request));
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Get payment details for an order")
    public ResponseEntity<PaymentResponse> getPayment(@PathVariable Long orderId) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(paymentService.getPaymentByOrderId(orderId, user));
    }
}

