package com.ebenn.incidenthub.service;

import com.ebenn.incidenthub.dto.IncidentRequest;
import com.ebenn.incidenthub.dto.IncidentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface IncidentService {
    Page<IncidentResponse> findAll(Pageable pageable, String status, String severity, String search);
    IncidentResponse findById(Long id);
    IncidentResponse create(IncidentRequest input);
    IncidentResponse updateStatus(Long id, String status);
}
