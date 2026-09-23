package com.oms;

import com.oms.dto.request.CreateOrderRequest;
import com.oms.dto.response.OrderResponse;
import com.oms.entity.*;
import com.oms.exception.InsufficientStockException;
import com.oms.exception.InvalidOrderStatusException;
import com.oms.repository.*;
import com.oms.service.CartService;
import com.oms.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private ShipmentRepository shipmentRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CartService cartService;

    @InjectMocks
    private OrderService orderService;

    private User customer;
    private Product product;
    private Cart cart;
    private CartItem cartItem;

    @BeforeEach
    void setUp() {
        customer = User.builder().id(1L).email("buyer@oms.com").fullName("Buyer").role(Role.ROLE_CUSTOMER).build();
        product = Product.builder()
                .id(20L)
                .name("Laptop")
                .price(new BigDecimal("1000.00"))
                .stockQuantity(10)
                .active(true)
                .build();
        cartItem = CartItem.builder().id(100L).product(product).quantity(2).build();
        cart = Cart.builder().id(50L).user(customer).items(new ArrayList<>(List.of(cartItem))).build();
    }

    @Test
    void testCreateOrderSuccessful() {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setShippingAddress("123 Test Street");
        request.setPaymentMethod(PaymentMethod.CARD);

        when(cartService.getOrCreateCart(customer)).thenReturn(cart);
        when(productRepository.findById(20L)).thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> {
            Order o = i.getArgument(0);
            o.setId(999L);
            return o;
        });
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));
        when(shipmentRepository.save(any(Shipment.class))).thenAnswer(i -> i.getArgument(0));

        OrderResponse response = orderService.createOrder(customer, request);

        assertNotNull(response);
        assertEquals(8, product.getStockQuantity()); // 10 - 2 = 8
        assertEquals(new BigDecimal("2000.00"), response.getTotalAmount()); // 1000 * 2
        assertEquals(OrderStatus.CONFIRMED, response.getStatus()); // Card order is CONFIRMED
        assertNotNull(response.getPayment());
        assertEquals(PaymentStatus.SUCCESS, response.getPayment().getPaymentStatus());
        assertNotNull(response.getShipment());
        assertTrue(response.getShipment().getTrackingNumber().startsWith("TRK-"));
        verify(cartService, times(1)).clearCart(customer);
    }

    @Test
    void testCreateOrderInsufficientStock() {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setShippingAddress("123 Test Street");
        request.setPaymentMethod(PaymentMethod.CARD);

        product.setStockQuantity(1); // Cart has 2, only 1 in stock

        when(cartService.getOrCreateCart(customer)).thenReturn(cart);
        when(productRepository.findById(20L)).thenReturn(Optional.of(product));

        assertThrows(InsufficientStockException.class, () -> orderService.createOrder(customer, request));
        assertEquals(1, product.getStockQuantity()); // Unchanged
    }

    @Test
    void testCancelOrderRestoresStock() {
        OrderItem item = OrderItem.builder()
                .product(product)
                .productName(product.getName())
                .quantity(3)
                .unitPrice(new BigDecimal("1000.00"))
                .subtotal(new BigDecimal("3000.00"))
                .build();

        Payment payment = Payment.builder()
                .paymentStatus(PaymentStatus.SUCCESS)
                .amount(new BigDecimal("3000.00"))
                .build();

        Order order = Order.builder()
                .id(500L)
                .orderNumber("ORD-TEST-123")
                .user(customer)
                .status(OrderStatus.CONFIRMED)
                .orderItems(new ArrayList<>(List.of(item)))
                .payment(payment)
                .build();

        when(orderRepository.findById(500L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        int initialStock = product.getStockQuantity(); // 10

        OrderResponse response = orderService.cancelOrder(customer, 500L);

        assertEquals(OrderStatus.CANCELLED, response.getStatus());
        assertEquals(initialStock + 3, product.getStockQuantity()); // 10 + 3 = 13
        assertEquals(PaymentStatus.REFUNDED, order.getPayment().getPaymentStatus());
        verify(productRepository, times(1)).save(product);
    }

    @Test
    void testInvalidOrderStatusTransition() {
        Order order = Order.builder()
                .id(600L)
                .orderNumber("ORD-TEST-456")
                .user(customer)
                .status(OrderStatus.DELIVERED)
                .build();

        when(orderRepository.findById(600L)).thenReturn(Optional.of(order));

        assertThrows(InvalidOrderStatusException.class, () ->
                orderService.updateOrderStatusForAdmin(600L, OrderStatus.PLACED));
    }
}
