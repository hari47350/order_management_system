package com.oms.service;

import com.oms.dto.request.CreateOrderRequest;
import com.oms.dto.response.*;
import com.oms.entity.*;
import com.oms.exception.BadRequestException;
import com.oms.exception.InsufficientStockException;
import com.oms.exception.InvalidOrderStatusException;
import com.oms.exception.ResourceNotFoundException;
import com.oms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final ShipmentRepository shipmentRepository;
    private final ProductRepository productRepository;
    private final CartService cartService;
    private final PaymentGatewayService paymentGatewayService;

    @Transactional
    public OrderResponse createOrder(User customer, CreateOrderRequest request) {
        Cart cart = cartService.getOrCreateCart(customer);
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new BadRequestException("Your cart is empty. Please add items before placing an order.");
        }

        // 1. Verify stock and calculate total server-side
        BigDecimal calculatedTotal = BigDecimal.ZERO;
        List<OrderItem> orderItemsToSave = new ArrayList<>();

        for (CartItem item : cart.getItems()) {
            Product product = productRepository.findById(item.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + item.getProduct().getName()));

            if (!product.isActive()) {
                throw new BadRequestException("Product is inactive and cannot be ordered: " + product.getName());
            }

            if (product.getStockQuantity() < item.getQuantity()) {
                throw new InsufficientStockException("Insufficient stock for product: " + product.getName() +
                        ". Available: " + product.getStockQuantity() + ", requested: " + item.getQuantity());
            }

            // Deduct inventory
            product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
            productRepository.save(product);

            BigDecimal itemUnitPrice = product.getPrice();
            BigDecimal itemSubtotal = itemUnitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
            calculatedTotal = calculatedTotal.add(itemSubtotal);

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .productName(product.getName())
                    .unitPrice(itemUnitPrice)
                    .quantity(item.getQuantity())
                    .subtotal(itemSubtotal)
                    .build();

            orderItemsToSave.add(orderItem);
        }

        // 2. Generate unique order number
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String randomSuffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String orderNumber = "ORD-" + timestamp + "-" + randomSuffix;

        OrderStatus initialStatus = (request.getPaymentMethod() == PaymentMethod.COD) ?
                OrderStatus.PLACED : OrderStatus.CONFIRMED;

        // 3. Create Order
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .user(customer)
                .totalAmount(calculatedTotal)
                .status(initialStatus)
                .shippingAddress(request.getShippingAddress())
                .notes(request.getNotes())
                .build();

        Order savedOrder = orderRepository.save(order);

        // 4. Attach and save OrderItems
        for (OrderItem oi : orderItemsToSave) {
            oi.setOrder(savedOrder);
            orderItemRepository.save(oi);
        }
        savedOrder.setOrderItems(orderItemsToSave);

        // 5. Create Payment record
        PaymentStatus initialPaymentStatus;
        LocalDateTime paidTime = null;
        String txnRef;
        String cardLast4 = request.getCardLast4();
        String cardBrand = request.getCardBrand();
        String gatewayStatus;

        if (request.getPaymentMethod() == PaymentMethod.COD) {
            initialPaymentStatus = PaymentStatus.PENDING;
            txnRef = "COD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            gatewayStatus = "pending_cod";
        } else {
            if (StringUtils.hasText(request.getPaymentIntentId())) {
                PaymentVerificationResult verification = paymentGatewayService.verifyIntentForOrder(
                        request.getPaymentIntentId(), calculatedTotal);
                initialPaymentStatus = PaymentStatus.SUCCESS;
                paidTime = LocalDateTime.now();
                txnRef = verification.getTransactionRef();
                cardLast4 = StringUtils.hasText(verification.getCardLast4()) ? verification.getCardLast4() : cardLast4;
                cardBrand = StringUtils.hasText(verification.getCardBrand()) ? verification.getCardBrand() : cardBrand;
                gatewayStatus = verification.getGatewayStatus();
            } else {
                initialPaymentStatus = PaymentStatus.SUCCESS;
                paidTime = LocalDateTime.now();
                txnRef = StringUtils.hasText(request.getTestPaymentRef()) ? request.getTestPaymentRef()
                        : "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                gatewayStatus = "succeeded_simulated";
            }
        }

        Payment payment = Payment.builder()
                .order(savedOrder)
                .amount(calculatedTotal)
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(initialPaymentStatus)
                .transactionRef(txnRef)
                .gatewayPaymentIntentId(request.getPaymentIntentId())
                .cardLast4(cardLast4)
                .cardBrand(cardBrand)
                .gatewayStatus(gatewayStatus)
                .paidAt(paidTime)
                .build();
        Payment savedPayment = paymentRepository.save(payment);
        savedOrder.setPayment(savedPayment);

        // 6. Create Shipment record
        String trackingNumber = "TRK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Shipment shipment = Shipment.builder()
                .order(savedOrder)
                .trackingNumber(trackingNumber)
                .carrier("Express OMS Logistics")
                .status(ShipmentStatus.PENDING)
                .estimatedDeliveryDate(LocalDateTime.now().plusDays(4))
                .build();
        Shipment savedShipment = shipmentRepository.save(shipment);
        savedOrder.setShipment(savedShipment);

        // 7. Clear cart
        cartService.clearCart(customer);

        log.info("Order successfully created: {} for user: {}", orderNumber, customer.getEmail());
        return toOrderResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getCustomerOrders(User customer, Pageable pageable) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(customer.getId(), pageable)
                .map(this::toOrderResponse);
    }

    @Transactional(readOnly = true)
    public OrderResponse getCustomerOrderById(User customer, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (!order.getUser().getId().equals(customer.getId())) {
            throw new ResourceNotFoundException("Order not found with id: " + orderId);
        }

        return toOrderResponse(order);
    }

    @Transactional
    public OrderResponse cancelOrder(User user, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        boolean isAdmin = user.getRole() == Role.ROLE_ADMIN;
        if (!isAdmin && !order.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Order not found with id: " + orderId);
        }

        if (!order.getStatus().isCancellable()) {
            throw new InvalidOrderStatusException("Cannot cancel order in status: " + order.getStatus() +
                    ". Only PLACED, CONFIRMED, or PROCESSING orders can be cancelled.");
        }

        // Restore stock
        for (OrderItem item : order.getOrderItems()) {
            Product product = item.getProduct();
            if (product != null) {
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                productRepository.save(product);
            }
        }

        // Update payment status to REFUNDED if was SUCCESS
        if (order.getPayment() != null && order.getPayment().getPaymentStatus() == PaymentStatus.SUCCESS) {
            order.getPayment().setPaymentStatus(PaymentStatus.REFUNDED);
            paymentRepository.save(order.getPayment());
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order updatedOrder = orderRepository.save(order);

        log.info("Order {} cancelled and stock restored.", order.getOrderNumber());
        return toOrderResponse(updatedOrder);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrdersForAdmin(OrderStatus status, Pageable pageable) {
        if (status != null) {
            return orderRepository.findByStatusOrderByCreatedAtDesc(status, pageable).map(this::toOrderResponse);
        }
        return orderRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toOrderResponse);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByIdForAdmin(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        return toOrderResponse(order);
    }

    @Transactional
    public OrderResponse updateOrderStatusForAdmin(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (!order.getStatus().canTransitionTo(newStatus)) {
            throw new InvalidOrderStatusException("Invalid status transition from " + order.getStatus() + " to " + newStatus);
        }

        // If transitioning to CANCELLED via admin, restore stock
        if (newStatus == OrderStatus.CANCELLED) {
            for (OrderItem item : order.getOrderItems()) {
                Product product = item.getProduct();
                if (product != null) {
                    product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                    productRepository.save(product);
                }
            }
            if (order.getPayment() != null && order.getPayment().getPaymentStatus() == PaymentStatus.SUCCESS) {
                order.getPayment().setPaymentStatus(PaymentStatus.REFUNDED);
                paymentRepository.save(order.getPayment());
            }
        }

        // Synchronize shipment status
        if (order.getShipment() != null) {
            switch (newStatus) {
                case SHIPPED -> order.getShipment().setStatus(ShipmentStatus.IN_TRANSIT);
                case OUT_FOR_DELIVERY -> order.getShipment().setStatus(ShipmentStatus.OUT_FOR_DELIVERY);
                case DELIVERED -> {
                    order.getShipment().setStatus(ShipmentStatus.DELIVERED);
                    order.getShipment().setDeliveredAt(LocalDateTime.now());
                    if (order.getPayment() != null && order.getPayment().getPaymentStatus() == PaymentStatus.PENDING) {
                        order.getPayment().setPaymentStatus(PaymentStatus.SUCCESS);
                        order.getPayment().setPaidAt(LocalDateTime.now());
                        paymentRepository.save(order.getPayment());
                    }
                }
                default -> {}
            }
            shipmentRepository.save(order.getShipment());
        }

        order.setStatus(newStatus);
        return toOrderResponse(orderRepository.save(order));
    }

    public OrderResponse toOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = new ArrayList<>();
        if (order.getOrderItems() != null) {
            for (OrderItem oi : order.getOrderItems()) {
                itemResponses.add(OrderItemResponse.builder()
                        .id(oi.getId())
                        .productId(oi.getProduct() != null ? oi.getProduct().getId() : null)
                        .productName(oi.getProductName())
                        .unitPrice(oi.getUnitPrice())
                        .quantity(oi.getQuantity())
                        .subtotal(oi.getSubtotal())
                        .build());
            }
        }

        PaymentResponse paymentResp = null;
        if (order.getPayment() != null) {
            Payment p = order.getPayment();
            paymentResp = PaymentResponse.builder()
                    .id(p.getId())
                    .orderId(order.getId())
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

        ShipmentResponse shipmentResp = null;
        if (order.getShipment() != null) {
            Shipment s = order.getShipment();
            shipmentResp = ShipmentResponse.builder()
                    .id(s.getId())
                    .orderId(order.getId())
                    .trackingNumber(s.getTrackingNumber())
                    .carrier(s.getCarrier())
                    .status(s.getStatus())
                    .estimatedDeliveryDate(s.getEstimatedDeliveryDate())
                    .deliveredAt(s.getDeliveredAt())
                    .createdAt(s.getCreatedAt())
                    .build();
        }

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .customerId(order.getUser() != null ? order.getUser().getId() : null)
                .customerName(order.getUser() != null ? order.getUser().getFullName() : null)
                .customerEmail(order.getUser() != null ? order.getUser().getEmail() : null)
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .shippingAddress(order.getShippingAddress())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .items(itemResponses)
                .payment(paymentResp)
                .shipment(shipmentResp)
                .build();
    }
}
