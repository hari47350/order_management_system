package com.oms.service;

import com.oms.dto.response.PaymentResponse;
import com.oms.entity.Order;
import com.oms.entity.Payment;
import com.oms.entity.Role;
import com.oms.entity.User;
import com.oms.exception.ResourceNotFoundException;
import com.oms.repository.OrderRepository;
import com.oms.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByOrderId(Long orderId, User user) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (user.getRole() != Role.ROLE_ADMIN && !order.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Order not found with id: " + orderId);
        }

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for order id: " + orderId));

        return toPaymentResponse(payment);
    }

    public PaymentResponse toPaymentResponse(Payment p) {
        return PaymentResponse.builder()
                .id(p.getId())
                .orderId(p.getOrder().getId())
                .amount(p.getAmount())
                .paymentMethod(p.getPaymentMethod())
                .paymentStatus(p.getPaymentStatus())
                .transactionRef(p.getTransactionRef())
                .gatewayPaymentIntentId(p.getGatewayPaymentIntentId())
                .cardLast4(p.getCardLast4())
                .cardBrand(p.getCardBrand())
                .gatewayStatus(p.getGatewayStatus())
                .paidAt(p.getPaidAt())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
