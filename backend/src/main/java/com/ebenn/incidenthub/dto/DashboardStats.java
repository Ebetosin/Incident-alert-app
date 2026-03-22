package com.ebenn.incidenthub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    private long totalIncidents;
    private long openIncidents;
    private long criticalIncidents;
    private long resolvedToday;
    private Map<String, Long> byStatus;
    private Map<String, Long> bySeverity;
    private Map<String, Long> byService;
}
