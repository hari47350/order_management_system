package com.oms;

import com.oms.dto.request.CartItemRequest;
import com.oms.dto.response.CartResponse;
import com.oms.entity.Cart;
import com.oms.entity.CartItem;
import com.oms.entity.Product;
import com.oms.entity.User;
import com.oms.exception.InsufficientStockException;
import com.oms.repository.CartItemRepository;
import com.oms.repository.CartRepository;
import com.oms.repository.ProductRepository;
import com.oms.service.CartService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private CartService cartService;

    private User user;
    private Cart cart;
    private Product product;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).email("john@example.com").build();
        cart = Cart.builder().id(5L).user(user).items(new ArrayList<>()).build();
        product = Product.builder()
                .id(100L)
                .name("Wireless Earbuds")
                .price(new BigDecimal("50.00"))
                .stockQuantity(10)
                .active(true)
                .build();
    }

    @Test
    void testAddToCartSuccess() {
        CartItemRequest request = new CartItemRequest();
        request.setProductId(100L);
        request.setQuantity(2);

        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));
        when(cartItemRepository.findByCartIdAndProductId(5L, 100L)).thenReturn(Optional.empty());

        CartResponse response = cartService.addToCart(user, request);

        assertNotNull(response);
        assertEquals(1, cart.getItems().size());
        assertEquals(2, cart.getItems().get(0).getQuantity());
        verify(cartItemRepository, times(1)).save(any(CartItem.class));
    }

    @Test
    void testAddToCartInsufficientStockThrowsException() {
        CartItemRequest request = new CartItemRequest();
        request.setProductId(100L);
        request.setQuantity(15); // product stock is 10

        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));

        assertThrows(InsufficientStockException.class, () -> cartService.addToCart(user, request));
    }
}
