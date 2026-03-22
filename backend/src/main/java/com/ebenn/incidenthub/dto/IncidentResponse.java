package com.ebenn.incidenthub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentResponse {
    private Long id;
    private String serviceName;
    private String severity;
    private String status;
    private String message;
    private Instant createdAt;
    private Instant updatedAt;
}
