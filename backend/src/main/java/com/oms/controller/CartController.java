package com.oms.controller;

import com.oms.dto.request.CartItemRequest;
import com.oms.dto.response.CartResponse;
import com.oms.entity.User;
import com.oms.service.AuthService;
import com.oms.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "Shopping cart operations")
public class CartController {

    private final CartService cartService;
    private final AuthService authService;

    @GetMapping
    @Operation(summary = "Get current user's shopping cart")
    public ResponseEntity<CartResponse> getCart() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(cartService.getCartResponse(user));
    }

    @PostMapping("/items")
    @Operation(summary = "Add an item to the shopping cart")
    public ResponseEntity<CartResponse> addItemToCart(@Valid @RequestBody CartItemRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(cartService.addToCart(user, request));
    }

    @PutMapping("/items/{id}")
    @Operation(summary = "Update cart item quantity")
    public ResponseEntity<CartResponse> updateItemQuantity(
            @PathVariable Long id,
            @RequestParam Integer quantity) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(cartService.updateCartItemQuantity(user, id, quantity));
    }

    @DeleteMapping("/items/{id}")
    @Operation(summary = "Remove an item from the shopping cart")
    public ResponseEntity<CartResponse> removeItem(@PathVariable Long id) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(cartService.removeCartItem(user, id));
    }

    @DeleteMapping
    @Operation(summary = "Clear all items in the shopping cart")
    public ResponseEntity<Void> clearCart() {
        User user = authService.getCurrentAuthenticatedUser();
        cartService.clearCart(user);
        return ResponseEntity.noContent().build();
    }
}
