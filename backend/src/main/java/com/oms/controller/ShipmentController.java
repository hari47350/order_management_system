package com.oms.controller;

import com.oms.dto.response.ShipmentResponse;
import com.oms.entity.ShipmentStatus;
import com.oms.entity.User;
import com.oms.service.AuthService;
import com.oms.service.ShipmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "Shipments", description = "Shipment tracking endpoints")
public class ShipmentController {

    private final ShipmentService shipmentService;
    private final AuthService authService;

    @GetMapping("/api/shipments/{orderId}")
    @Operation(summary = "Get shipment details by order ID")
    public ResponseEntity<ShipmentResponse> getShipment(@PathVariable Long orderId) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(shipmentService.getShipmentByOrderId(orderId, user));
    }

    @GetMapping("/api/shipments/track/{trackingNumber}")
    @Operation(summary = "Track shipment by tracking number (Public/Customer)")
    public ResponseEntity<ShipmentResponse> trackShipment(@PathVariable String trackingNumber) {
        return ResponseEntity.ok(shipmentService.getShipmentByTrackingNumber(trackingNumber));
    }

    @PutMapping("/api/admin/shipments/{orderId}/status")
    @Operation(summary = "Update shipment status directly (Admin only)")
    public ResponseEntity<ShipmentResponse> updateShipmentStatus(
            @PathVariable Long orderId,
            @RequestParam ShipmentStatus status) {
        return ResponseEntity.ok(shipmentService.updateShipmentStatus(orderId, status));
    }
}
