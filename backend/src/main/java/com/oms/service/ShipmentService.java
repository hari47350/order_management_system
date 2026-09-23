package com.oms.service;

import com.oms.dto.response.ShipmentResponse;
import com.oms.entity.Order;
import com.oms.entity.Role;
import com.oms.entity.Shipment;
import com.oms.entity.ShipmentStatus;
import com.oms.entity.User;
import com.oms.exception.ResourceNotFoundException;
import com.oms.repository.OrderRepository;
import com.oms.repository.ShipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public ShipmentResponse getShipmentByOrderId(Long orderId, User user) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (user.getRole() != Role.ROLE_ADMIN && !order.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Order not found with id: " + orderId);
        }

        Shipment shipment = shipmentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found for order id: " + orderId));

        return toShipmentResponse(shipment);
    }

    @Transactional(readOnly = true)
    public ShipmentResponse getShipmentByTrackingNumber(String trackingNumber) {
        Shipment shipment = shipmentRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found with tracking number: " + trackingNumber));
        return toShipmentResponse(shipment);
    }

    @Transactional
    public ShipmentResponse updateShipmentStatus(Long orderId, ShipmentStatus status) {
        Shipment shipment = shipmentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found for order id: " + orderId));

        shipment.setStatus(status);
        if (status == ShipmentStatus.DELIVERED) {
            shipment.setDeliveredAt(LocalDateTime.now());
        }
        return toShipmentResponse(shipmentRepository.save(shipment));
    }

    public ShipmentResponse toShipmentResponse(Shipment s) {
        return ShipmentResponse.builder()
                .id(s.getId())
                .orderId(s.getOrder().getId())
                .trackingNumber(s.getTrackingNumber())
                .carrier(s.getCarrier())
                .status(s.getStatus())
                .estimatedDeliveryDate(s.getEstimatedDeliveryDate())
                .deliveredAt(s.getDeliveredAt())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
