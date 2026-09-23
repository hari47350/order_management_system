package com.oms;

import com.oms.dto.request.PaymentConfirmRequest;
import com.oms.dto.response.PaymentIntentResponse;
import com.oms.dto.response.PaymentVerificationResult;
import com.oms.entity.PaymentMethod;
import com.oms.entity.User;
import com.oms.exception.BadRequestException;
import com.oms.service.PaymentGatewayService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class PaymentGatewayServiceTest {

    private PaymentGatewayService paymentGatewayService;
    private User testUser;

    @BeforeEach
    void setUp() {
        paymentGatewayService = new PaymentGatewayService();
        testUser = User.builder().id(99L).email("payer@example.com").build();
    }

    @Test
    void testCreatePaymentIntent() {
        BigDecimal amount = new BigDecimal("149.99");
        PaymentIntentResponse response = paymentGatewayService.createPaymentIntent(
                testUser, amount, PaymentMethod.CARD, "usd");

        assertNotNull(response);
        assertNotNull(response.getPaymentIntentId());
        assertTrue(response.getPaymentIntentId().startsWith("pi_"));
        assertNotNull(response.getClientSecret());
        assertEquals(amount, response.getAmount());
        assertEquals("requires_payment_method", response.getStatus());
    }

    @Test
    void testConfirmAndVerifyPayment() {
        BigDecimal amount = new BigDecimal("89.50");
        PaymentIntentResponse intent = paymentGatewayService.createPaymentIntent(
                testUser, amount, PaymentMethod.CARD, "usd");

        PaymentConfirmRequest confirmRequest = PaymentConfirmRequest.builder()
                .paymentIntentId(intent.getPaymentIntentId())
                .paymentMethod(PaymentMethod.CARD)
                .cardLast4("4242")
                .cardBrand("VISA")
                .build();

        PaymentVerificationResult result = paymentGatewayService.confirmPayment(testUser, confirmRequest);
        assertTrue(result.isVerified());
        assertEquals("succeeded", result.getGatewayStatus());
        assertEquals("4242", result.getCardLast4());
        assertEquals("VISA", result.getCardBrand());
        assertTrue(result.getTransactionRef().startsWith("TXN-"));

        // Verify for order creation
        PaymentVerificationResult orderVerification = paymentGatewayService.verifyIntentForOrder(
                intent.getPaymentIntentId(), amount);
        assertTrue(orderVerification.isVerified());
    }

    @Test
    void testVerifyIntentUnderpaidThrowsException() {
        BigDecimal amount = new BigDecimal("50.00");
        PaymentIntentResponse intent = paymentGatewayService.createPaymentIntent(
                testUser, amount, PaymentMethod.CARD, "usd");

        paymentGatewayService.confirmPayment(testUser, PaymentConfirmRequest.builder()
                .paymentIntentId(intent.getPaymentIntentId())
                .paymentMethod(PaymentMethod.CARD)
                .build());

        // Expected amount is 100.00, but only paid 50.00
        assertThrows(BadRequestException.class, () ->
                paymentGatewayService.verifyIntentForOrder(intent.getPaymentIntentId(), new BigDecimal("100.00")));
    }
}
