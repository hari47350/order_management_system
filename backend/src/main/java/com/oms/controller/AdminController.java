package com.oms.controller;

import com.oms.dto.request.InventoryUpdateRequest;
import com.oms.dto.response.CustomerSummaryResponse;
import com.oms.dto.response.DashboardResponse;
import com.oms.dto.response.ProductResponse;
import com.oms.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin Operations", description = "Dashboard, inventory, and customer management endpoints")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get aggregated dashboard metrics (live MySQL data)")
    public ResponseEntity<DashboardResponse> getDashboardMetrics() {
        return ResponseEntity.ok(adminService.getDashboardMetrics());
    }

    @GetMapping("/inventory")
    @Operation(summary = "Get current inventory list with stock levels")
    public ResponseEntity<Page<ProductResponse>> getInventory(
            @RequestParam(required = false) Boolean lowStockOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "stockQuantity"));
        return ResponseEntity.ok(adminService.getInventory(lowStockOnly, pageable));
    }

    @PutMapping("/inventory/{productId}")
    @Operation(summary = "Adjust inventory stock for a product")
    public ResponseEntity<ProductResponse> updateInventory(
            @PathVariable Long productId,
            @RequestBody InventoryUpdateRequest request) {
        return ResponseEntity.ok(adminService.updateStock(productId, request));
    }

    @GetMapping("/customers")
    @Operation(summary = "Get all registered customers with order counts")
    public ResponseEntity<List<CustomerSummaryResponse>> getCustomers() {
        return ResponseEntity.ok(adminService.getCustomers());
    }

    @PutMapping("/customers/{userId}/role")
    @Operation(summary = "Update user role (e.g. promote customer to admin)")
    public ResponseEntity<CustomerSummaryResponse> updateUserRole(
            @PathVariable Long userId,
            @RequestParam com.oms.entity.Role role) {
        return ResponseEntity.ok(adminService.updateUserRole(userId, role));
    }

    @PostMapping("/users")
    @Operation(summary = "Provision a new administrator or user account")
    public ResponseEntity<CustomerSummaryResponse> createUser(
            @jakarta.validation.Valid @RequestBody com.oms.dto.request.CreateUserRequest request) {
        return ResponseEntity.ok(adminService.createUser(request));
    }
}
