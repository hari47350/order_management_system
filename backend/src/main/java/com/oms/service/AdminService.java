package com.oms.service;

import com.oms.dto.request.CreateUserRequest;
import com.oms.dto.request.InventoryUpdateRequest;
import com.oms.dto.response.CustomerSummaryResponse;
import com.oms.dto.response.DashboardResponse;
import com.oms.dto.response.ProductResponse;
import com.oms.entity.OrderStatus;
import com.oms.entity.Product;
import com.oms.entity.Role;
import com.oms.entity.User;
import com.oms.exception.BadRequestException;
import com.oms.exception.ResourceNotFoundException;
import com.oms.repository.OrderRepository;
import com.oms.repository.ProductRepository;
import com.oms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductService productService;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboardMetrics() {
        long totalOrders = orderRepository.count();
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue();
        long totalCustomers = userRepository.countByRole(Role.ROLE_CUSTOMER);
        long totalProducts = productRepository.countByActiveTrue();
        long lowStockProducts = productRepository.countByStockQuantityLessThanEqual(5);

        long placed = orderRepository.countByStatus(OrderStatus.PLACED);
        long confirmed = orderRepository.countByStatus(OrderStatus.CONFIRMED);
        long processing = orderRepository.countByStatus(OrderStatus.PROCESSING);
        long shipped = orderRepository.countByStatus(OrderStatus.SHIPPED);
        long outForDelivery = orderRepository.countByStatus(OrderStatus.OUT_FOR_DELIVERY);
        long delivered = orderRepository.countByStatus(OrderStatus.DELIVERED);
        long cancelled = orderRepository.countByStatus(OrderStatus.CANCELLED);

        long pendingOrders = placed + confirmed + processing;

        Map<String, Long> statusBreakdown = new HashMap<>();
        statusBreakdown.put("PLACED", placed);
        statusBreakdown.put("CONFIRMED", confirmed);
        statusBreakdown.put("PROCESSING", processing);
        statusBreakdown.put("SHIPPED", shipped);
        statusBreakdown.put("OUT_FOR_DELIVERY", outForDelivery);
        statusBreakdown.put("DELIVERED", delivered);
        statusBreakdown.put("CANCELLED", cancelled);

        return DashboardResponse.builder()
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .totalCustomers(totalCustomers)
                .totalProducts(totalProducts)
                .lowStockProducts(lowStockProducts)
                .pendingOrders(pendingOrders)
                .deliveredOrders(delivered)
                .cancelledOrders(cancelled)
                .statusBreakdown(statusBreakdown)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getInventory(Boolean lowStockOnly, Pageable pageable) {
        if (Boolean.TRUE.equals(lowStockOnly)) {
            // Filter products with stock <= 5
            return productRepository.searchProducts(null, null, null, null, null, pageable)
                    .map(productService::toProductResponse);
        }
        return productRepository.findAll(pageable).map(productService::toProductResponse);
    }

    @Transactional
    public ProductResponse updateStock(Long productId, InventoryUpdateRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        int newStock;
        if (request.getNewStockQuantity() != null) {
            newStock = request.getNewStockQuantity();
        } else if (request.getQuantityChange() != null) {
            newStock = product.getStockQuantity() + request.getQuantityChange();
        } else {
            throw new BadRequestException("Either quantityChange or newStockQuantity must be provided.");
        }

        if (newStock < 0) {
            throw new BadRequestException("Stock quantity cannot be negative. Resulting stock would be: " + newStock);
        }

        product.setStockQuantity(newStock);
        return productService.toProductResponse(productRepository.save(product));
    }

    @Transactional(readOnly = true)
    public List<CustomerSummaryResponse> getCustomers() {
        List<User> users = userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        return users.stream().map(c -> {
            long orderCount = orderRepository.countByUserId(c.getId());
            return CustomerSummaryResponse.builder()
                    .id(c.getId())
                    .fullName(c.getFullName())
                    .email(c.getEmail())
                    .phone(c.getPhone())
                    .role(c.getRole())
                    .orderCount(orderCount)
                    .registeredAt(c.getCreatedAt())
                    .build();
        }).toList();
    }

    @Transactional
    public CustomerSummaryResponse updateUserRole(Long userId, Role newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setRole(newRole);
        user = userRepository.save(user);
        long orderCount = orderRepository.countByUserId(user.getId());
        return CustomerSummaryResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .orderCount(orderCount)
                .registeredAt(user.getCreatedAt())
                .build();
    }

    @Transactional
    public CustomerSummaryResponse createUser(CreateUserRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new BadRequestException("An account with email " + cleanEmail + " already exists.");
        }
        Role targetRole = request.getRole() != null ? request.getRole() : Role.ROLE_ADMIN;
        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(cleanEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .role(targetRole)
                .build();
        user = userRepository.save(user);
        return CustomerSummaryResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .orderCount(0)
                .registeredAt(user.getCreatedAt())
                .build();
    }
}
