package com.oms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private long totalOrders;
    private BigDecimal totalRevenue;
    private long totalCustomers;
    private long totalProducts;
    private long lowStockProducts;
    private long pendingOrders;
    private long deliveredOrders;
    private long cancelledOrders;
    private Map<String, Long> statusBreakdown;
}
