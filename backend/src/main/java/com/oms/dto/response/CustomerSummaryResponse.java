package com.oms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerSummaryResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private long orderCount;
    private com.oms.entity.Role role;
    private LocalDateTime registeredAt;
}
