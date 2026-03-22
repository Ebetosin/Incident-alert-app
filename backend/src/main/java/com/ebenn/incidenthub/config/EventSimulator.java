package com.ebenn.incidenthub.config;

import com.ebenn.incidenthub.dto.IncidentRequest;
import com.ebenn.incidenthub.service.IncidentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Component
@ConditionalOnProperty(name = "app.simulator.enabled", havingValue = "true")
public class EventSimulator {

    private static final Logger log = LoggerFactory.getLogger(EventSimulator.class);

    private final IncidentService incidentService;

    private static final List<String> SERVICES = List.of(
            "auth-service", "payments-api", "user-service", "api-gateway",
            "notification-service", "inventory-service", "search-service",
            "billing-service", "analytics-engine", "file-upload-service"
    );

    private static final List<String> MESSAGES = List.of(
            "Response time exceeded 5000ms threshold",
            "Error rate spiked above 5% for the last 2 minutes",
            "Database connection pool exhausted",
            "Memory usage exceeded 90% — possible memory leak",
            "SSL certificate expires in 7 days",
            "Disk usage reached 85% on primary volume",
            "Health check endpoint returning 503",
            "Unhandled NullPointerException in request pipeline",
            "Kafka consumer lag increased to 50,000 messages",
            "Rate limiter triggered — 429 responses exceeding baseline",
            "CPU utilisation sustained above 95% for 3 minutes",
            "Deployment rollback triggered after failed readiness probe",
            "DNS resolution timeout for downstream dependency",
            "Connection refused on port 5432 — PostgreSQL unreachable",
            "JWT token validation failures increased 300%",
            "Circuit breaker OPEN for downstream order-service",
            "Pod OOMKilled — container exceeded 512Mi memory limit",
            "gRPC deadline exceeded calling inventory-service",
            "Latency p99 jumped from 200ms to 4200ms",
            "Scheduled job cron-cleanup failed with exit code 1"
    );

    public EventSimulator(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @Scheduled(fixedDelayString = "${app.simulator.interval-ms:45000}", initialDelay = 5000)
    public void generateIncident() {
        ThreadLocalRandom rng = ThreadLocalRandom.current();

        String service = SERVICES.get(rng.nextInt(SERVICES.size()));
        String severity = weightedSeverity(rng);
        String message = MESSAGES.get(rng.nextInt(MESSAGES.size()));

        IncidentRequest request = IncidentRequest.builder()
                .serviceName(service)
                .severity(severity)
                .message(message)
                .build();

        incidentService.create(request);
        log.info("Simulated incident: service={} severity={}", service, severity);
    }

    private String weightedSeverity(ThreadLocalRandom rng) {
        int roll = rng.nextInt(100);
        if (roll < 40) return "LOW";
        if (roll < 70) return "MEDIUM";
        if (roll < 90) return "HIGH";
        return "CRITICAL";
    }
}
