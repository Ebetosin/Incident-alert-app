package com.ebenn.incidenthub.repo;

import com.ebenn.incidenthub.model.IncidentEntity;
import com.ebenn.incidenthub.model.IncidentStatus;
import com.ebenn.incidenthub.model.Severity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;

public interface IncidentRepository extends JpaRepository<IncidentEntity, Long> {
    Page<IncidentEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<IncidentEntity> findBySeverity(Severity severity);
    List<IncidentEntity> findByStatus(IncidentStatus status);
    long countByStatus(IncidentStatus status);
    long countBySeverity(Severity severity);

    @Query("SELECT i.serviceName, COUNT(i) FROM IncidentEntity i GROUP BY i.serviceName ORDER BY COUNT(i) DESC")
    List<Object[]> countGroupByService();

    long countByStatusAndUpdatedAtAfter(IncidentStatus status, Instant after);

    Page<IncidentEntity> findByStatusAndSeverity(IncidentStatus status, Severity severity, Pageable pageable);
    Page<IncidentEntity> findByStatus(IncidentStatus status, Pageable pageable);
    Page<IncidentEntity> findBySeverity(Severity severity, Pageable pageable);
    Page<IncidentEntity> findByServiceNameContainingIgnoreCase(String serviceName, Pageable pageable);
}
