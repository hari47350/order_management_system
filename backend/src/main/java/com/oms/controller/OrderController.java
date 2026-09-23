package com.oms.controller;

import com.oms.dto.request.CreateOrderRequest;
import com.oms.dto.request.UpdateOrderStatusRequest;
import com.oms.dto.response.OrderResponse;
import com.oms.entity.OrderStatus;
import com.oms.entity.User;
import com.oms.service.AuthService;
import com.oms.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order processing and tracking endpoints")
public class OrderController {

    private final OrderService orderService;
    private final AuthService authService;

    // --- Customer Endpoints ---

    @PostMapping("/api/orders")
    @Operation(summary = "Place a new order from current cart (Transactional)")
    public ResponseEntity<OrderResponse> placeOrder(@Valid @RequestBody CreateOrderRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        return new ResponseEntity<>(orderService.createOrder(user, request), HttpStatus.CREATED);
    }

    @GetMapping("/api/orders")
    @Operation(summary = "Get order history for current customer")
    public ResponseEntity<Page<OrderResponse>> getCustomerOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        User user = authService.getCurrentAuthenticatedUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(orderService.getCustomerOrders(user, pageable));
    }

    @GetMapping("/api/orders/{id}")
    @Operation(summary = "Get customer order details by ID (Ownership verified)")
    public ResponseEntity<OrderResponse> getCustomerOrder(@PathVariable Long id) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(orderService.getCustomerOrderById(user, id));
    }

    @PostMapping("/api/orders/{id}/cancel")
    @Operation(summary = "Cancel order and restore inventory (Customer or Admin)")
    public ResponseEntity<OrderResponse> cancelOrder(@PathVariable Long id) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(orderService.cancelOrder(user, id));
    }

    // --- Admin Endpoints ---

    @GetMapping("/api/admin/orders")
    @Operation(summary = "Get all orders in system (Admin only)")
    public ResponseEntity<Page<OrderResponse>> getAllOrdersForAdmin(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(orderService.getAllOrdersForAdmin(status, pageable));
    }

    @GetMapping("/api/admin/orders/{id}")
    @Operation(summary = "Get complete order details for admin")
    public ResponseEntity<OrderResponse> getOrderByIdForAdmin(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderByIdForAdmin(id));
    }

    @PutMapping("/api/admin/orders/{id}/status")
    @Operation(summary = "Update order status (Admin only with transition validation)")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(orderService.updateOrderStatusForAdmin(id, request.getStatus()));
    }
}
