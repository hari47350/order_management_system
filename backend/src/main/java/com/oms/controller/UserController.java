package com.oms.controller;

import com.oms.dto.request.AddressRequest;
import com.oms.dto.response.AddressResponse;
import com.oms.dto.response.CustomerSummaryResponse;
import com.oms.entity.Address;
import com.oms.entity.User;
import com.oms.repository.AddressRepository;
import com.oms.repository.OrderRepository;
import com.oms.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User & Addresses", description = "User profile and saved shipping addresses")
public class UserController {

    private final AuthService authService;
    private final AddressRepository addressRepository;
    private final OrderRepository orderRepository;

    @GetMapping("/profile")
    @Operation(summary = "Get user profile details")
    public ResponseEntity<CustomerSummaryResponse> getProfile() {
        User user = authService.getCurrentAuthenticatedUser();
        long orderCount = orderRepository.countByUserId(user.getId());
        return ResponseEntity.ok(CustomerSummaryResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .orderCount(orderCount)
                .registeredAt(user.getCreatedAt())
                .build());
    }

    @GetMapping("/addresses")
    @Operation(summary = "Get saved shipping addresses")
    public ResponseEntity<List<AddressResponse>> getAddresses() {
        User user = authService.getCurrentAuthenticatedUser();
        List<Address> addresses = addressRepository.findByUserId(user.getId());
        return ResponseEntity.ok(addresses.stream().map(this::toResponse).toList());
    }

    @PostMapping("/addresses")
    @Operation(summary = "Add a new shipping address")
    @Transactional
    public ResponseEntity<AddressResponse> addAddress(@Valid @RequestBody AddressRequest request) {
        User user = authService.getCurrentAuthenticatedUser();

        // If setting as default, unset others
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            List<Address> existing = addressRepository.findByUserId(user.getId());
            for (Address a : existing) {
                a.setDefault(false);
            }
            addressRepository.saveAll(existing);
        }

        Address address = Address.builder()
                .user(user)
                .street(request.getStreet())
                .city(request.getCity())
                .state(request.getState())
                .postalCode(request.getPostalCode())
                .country(request.getCountry())
                .isDefault(Boolean.TRUE.equals(request.getIsDefault()))
                .build();

        return new ResponseEntity<>(toResponse(addressRepository.save(address)), HttpStatus.CREATED);
    }

    private AddressResponse toResponse(Address a) {
        return AddressResponse.builder()
                .id(a.getId())
                .street(a.getStreet())
                .city(a.getCity())
                .state(a.getState())
                .postalCode(a.getPostalCode())
                .country(a.getCountry())
                .isDefault(a.isDefault())
                .build();
    }
}
