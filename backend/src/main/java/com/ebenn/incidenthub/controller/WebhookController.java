package com.ebenn.incidenthub.controller;

import com.ebenn.incidenthub.dto.IncidentRequest;
import com.ebenn.incidenthub.service.IncidentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);

    private final IncidentService service;

    public WebhookController(IncidentService service) {
        this.service = service;
    }

    @PostMapping("/alerts")
    public ResponseEntity<Map<String, String>> receiveAlert(@RequestBody Map<String, String> payload) {
        log.info("Webhook alert received from service: {}", payload.getOrDefault("service", "unknown"));

        IncidentRequest request = IncidentRequest.builder()
                .serviceName(payload.getOrDefault("service", "unknown"))
                .severity(payload.getOrDefault("severity", "MEDIUM"))
                .message(payload.getOrDefault("message", "Webhook alert"))
                .build();

        service.create(request);
        return ResponseEntity.accepted().body(Map.of("status", "accepted"));
    }
}
