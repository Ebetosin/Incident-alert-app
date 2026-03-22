package com.ebenn.incidenthub.service.impl;

import com.ebenn.incidenthub.dto.IncidentRequest;
import com.ebenn.incidenthub.dto.IncidentResponse;
import com.ebenn.incidenthub.exception.ResourceNotFoundException;
import com.ebenn.incidenthub.model.IncidentEntity;
import com.ebenn.incidenthub.model.IncidentStatus;
import com.ebenn.incidenthub.model.Severity;
import com.ebenn.incidenthub.repo.IncidentRepository;
import com.ebenn.incidenthub.service.AuditService;
import com.ebenn.incidenthub.service.IncidentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

@Service
public class IncidentServiceImpl implements IncidentService {

    private static final Logger log = LoggerFactory.getLogger(IncidentServiceImpl.class);

    private final IncidentRepository repo;
    private final StringRedisTemplate redis;
    private final SimpMessagingTemplate ws;
    private final AuditService auditService;

    public IncidentServiceImpl(IncidentRepository repo,
                               StringRedisTemplate redis,
                               SimpMessagingTemplate ws,
                               AuditService auditService) {
        this.repo = repo;
        this.redis = redis;
        this.ws = ws;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<IncidentResponse> findAll(Pageable pageable, String status, String severity, String search) {
        Page<IncidentEntity> page;

        if (search != null && !search.isBlank()) {
            page = repo.findByServiceNameContainingIgnoreCase(search.trim(), pageable);
        } else if (status != null && severity != null) {
            page = repo.findByStatusAndSeverity(
                    IncidentStatus.valueOf(status.toUpperCase()),
                    Severity.valueOf(severity.toUpperCase()),
                    pageable);
        } else if (status != null) {
            page = repo.findByStatus(IncidentStatus.valueOf(status.toUpperCase()), pageable);
        } else if (severity != null) {
            page = repo.findBySeverity(Severity.valueOf(severity.toUpperCase()), pageable);
        } else {
            page = repo.findAllByOrderByCreatedAtDesc(pageable);
        }

        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "incident", key = "#id")
    public IncidentResponse findById(Long id) {
        IncidentEntity entity = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident", id));
        return toResponse(entity);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"dashboardStats", "incidentCount"}, allEntries = true)
    public IncidentResponse create(IncidentRequest input) {
        Severity severity = Severity.valueOf(input.getSeverity().toUpperCase());

        IncidentEntity entity = IncidentEntity.builder()
                .serviceName(input.getServiceName())
                .severity(severity)
                .status(IncidentStatus.OPEN)
                .message(input.getMessage())
                .build();

        IncidentEntity saved = repo.save(entity);
        log.info("Incident created: id={} service={} severity={}", saved.getId(), saved.getServiceName(), saved.getSeverity());

        auditService.log("CREATE", "INCIDENT", saved.getId(),
                "Created incident: " + saved.getServiceName() + " [" + saved.getSeverity() + "]");
        cacheLastIncidentId(saved.getId());
        IncidentResponse response = toResponse(saved);
        ws.convertAndSend("/topic/incidents", response);
        return response;
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "incident", key = "#id"),
            @CacheEvict(value = {"dashboardStats", "incidentCount"}, allEntries = true)
    })
    public IncidentResponse updateStatus(Long id, String status) {
        IncidentEntity entity = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident", id));

        IncidentStatus newStatus = IncidentStatus.valueOf(status.toUpperCase());
        entity.setStatus(newStatus);
        IncidentEntity saved = repo.save(entity);
        log.info("Incident status updated: id={} status={}", saved.getId(), saved.getStatus());

        auditService.log("STATUS_CHANGE", "INCIDENT", saved.getId(),
                "Status changed to " + newStatus.name());

        IncidentResponse response = toResponse(saved);
        ws.convertAndSend("/topic/incidents", response);
        return response;
    }

    private void cacheLastIncidentId(Long id) {
        try {
            redis.opsForValue().set("incidents:last", String.valueOf(id), Duration.ofMinutes(20));
        } catch (RuntimeException ex) {
            log.warn("Redis unavailable; skipping incidents:last cache update.");
        }
    }

    private IncidentResponse toResponse(IncidentEntity entity) {
        return IncidentResponse.builder()
                .id(entity.getId())
                .serviceName(entity.getServiceName())
                .severity(entity.getSeverity().name())
                .status(entity.getStatus().name())
                .message(entity.getMessage())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
