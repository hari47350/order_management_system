package com.oms.service;

import com.oms.dto.request.CartItemRequest;
import com.oms.dto.response.CartItemResponse;
import com.oms.dto.response.CartResponse;
import com.oms.entity.Cart;
import com.oms.entity.CartItem;
import com.oms.entity.Product;
import com.oms.entity.User;
import com.oms.exception.BadRequestException;
import com.oms.exception.InsufficientStockException;
import com.oms.exception.ResourceNotFoundException;
import com.oms.repository.CartItemRepository;
import com.oms.repository.CartRepository;
import com.oms.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    @Transactional
    public Cart getOrCreateCart(User user) {
        return cartRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Cart newCart = Cart.builder()
                            .user(user)
                            .items(new ArrayList<>())
                            .build();
                    return cartRepository.save(newCart);
                });
    }

    @Transactional(readOnly = true)
    public CartResponse getCartResponse(User user) {
        Cart cart = getOrCreateCart(user);
        return toCartResponse(cart);
    }

    @Transactional
    public CartResponse addToCart(User user, CartItemRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        if (!product.isActive()) {
            throw new BadRequestException("Cannot add inactive product to cart: " + product.getName());
        }

        Cart cart = getOrCreateCart(user);
        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

        int requestedQuantity = request.getQuantity();
        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            int totalDesired = existingItem.getQuantity() + requestedQuantity;
            if (totalDesired > product.getStockQuantity()) {
                throw new InsufficientStockException("Cannot add " + requestedQuantity + " more. Only " +
                        product.getStockQuantity() + " in stock (" + existingItem.getQuantity() + " already in cart).");
            }
            existingItem.setQuantity(totalDesired);
            cartItemRepository.save(existingItem);
        } else {
            if (requestedQuantity > product.getStockQuantity()) {
                throw new InsufficientStockException("Cannot add " + requestedQuantity + ". Only " +
                        product.getStockQuantity() + " in stock.");
            }
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(requestedQuantity)
                    .build();
            cart.getItems().add(newItem);
            cartItemRepository.save(newItem);
        }

        return toCartResponse(cart);
    }

    @Transactional
    public CartResponse updateCartItemQuantity(User user, Long itemId, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            return removeCartItem(user, itemId);
        }

        Cart cart = getOrCreateCart(user);
        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + itemId));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Cart item does not belong to your cart.");
        }

        Product product = cartItem.getProduct();
        if (!product.isActive()) {
            throw new BadRequestException("Product is no longer active: " + product.getName());
        }

        if (quantity > product.getStockQuantity()) {
            throw new InsufficientStockException("Requested quantity " + quantity + " exceeds available stock (" +
                    product.getStockQuantity() + ").");
        }

        cartItem.setQuantity(quantity);
        cartItemRepository.save(cartItem);

        return toCartResponse(cart);
    }

    @Transactional
    public CartResponse removeCartItem(User user, Long itemId) {
        Cart cart = getOrCreateCart(user);
        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + itemId));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Cart item does not belong to your cart.");
        }

        cart.getItems().remove(cartItem);
        cartItemRepository.delete(cartItem);

        return toCartResponse(cart);
    }

    @Transactional
    public void clearCart(User user) {
        Cart cart = getOrCreateCart(user);
        cart.getItems().clear();
        cartItemRepository.deleteByCartId(cart.getId());
    }

    public CartResponse toCartResponse(Cart cart) {
        List<CartItemResponse> itemResponses = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        int totalItems = 0;

        if (cart.getItems() != null) {
            for (CartItem item : cart.getItems()) {
                Product p = item.getProduct();
                BigDecimal itemPrice = p.getPrice();
                BigDecimal itemSubtotal = itemPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
                subtotal = subtotal.add(itemSubtotal);
                totalItems += item.getQuantity();

                itemResponses.add(CartItemResponse.builder()
                        .id(item.getId())
                        .productId(p.getId())
                        .productName(p.getName())
                        .productPrice(itemPrice)
                        .productImageUrl(p.getImageUrl())
                        .quantity(item.getQuantity())
                        .subtotal(itemSubtotal)
                        .stockAvailable(p.getStockQuantity())
                        .active(p.isActive())
                        .build());
            }
        }

        return CartResponse.builder()
                .id(cart.getId())
                .items(itemResponses)
                .totalItems(totalItems)
                .subtotal(subtotal)
                .build();
    }
}
