package com.oms.dto.request;

import lombok.Data;

@Data
public class InventoryUpdateRequest {
    // Can supply either quantityChange (e.g. +10, -5) or newStockQuantity (e.g. 50)
    private Integer quantityChange;
    private Integer newStockQuantity;
}
