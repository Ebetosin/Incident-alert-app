package com.ebenn.incidenthub.controller;

import com.ebenn.incidenthub.dto.DashboardStats;
import com.ebenn.incidenthub.model.AuditLog;
import com.ebenn.incidenthub.model.IncidentStatus;
import com.ebenn.incidenthub.model.Severity;
import com.ebenn.incidenthub.repo.IncidentRepository;
import com.ebenn.incidenthub.service.AuditService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final IncidentRepository incidentRepository;
    private final AuditService auditService;

    public DashboardController(IncidentRepository incidentRepository, AuditService auditService) {
        this.incidentRepository = incidentRepository;
        this.auditService = auditService;
    }

    @GetMapping("/stats")
    @Cacheable(value = "dashboardStats", key = "'incident-stats'")
    public DashboardStats getStats() {
        long total = incidentRepository.count();
        long open = incidentRepository.countByStatus(IncidentStatus.OPEN);
        long critical = incidentRepository.countBySeverity(Severity.CRITICAL);

        Instant startOfDay = Instant.now().truncatedTo(ChronoUnit.DAYS);
        long resolvedToday = incidentRepository.countByStatusAndUpdatedAtAfter(IncidentStatus.RESOLVED, startOfDay);

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (IncidentStatus s : IncidentStatus.values()) {
            byStatus.put(s.name(), incidentRepository.countByStatus(s));
        }

        Map<String, Long> bySeverity = new LinkedHashMap<>();
        for (Severity s : Severity.values()) {
            bySeverity.put(s.name(), incidentRepository.countBySeverity(s));
        }

        Map<String, Long> byService = new LinkedHashMap<>();
        incidentRepository.countGroupByService().forEach(row ->
                byService.put((String) row[0], (Long) row[1])
        );

        return DashboardStats.builder()
                .totalIncidents(total)
                .openIncidents(open)
                .criticalIncidents(critical)
                .resolvedToday(resolvedToday)
                .byStatus(byStatus)
                .bySeverity(bySeverity)
                .byService(byService)
                .build();
    }

    @GetMapping("/audit-log")
    public ResponseEntity<Page<AuditLog>> getAuditLog(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auditService.findAll(PageRequest.of(page, Math.min(size, 100))));
    }
}
