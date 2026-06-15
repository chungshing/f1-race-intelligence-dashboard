package com.f1dashboard.backend.controller;

import com.f1dashboard.backend.service.F1SyncScheduler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/automation")
public class ProductionSyncController {

    private final F1SyncScheduler syncScheduler;

    @Value("${CRON_SECRET_TOKEN:local-dev-fallback}")
    private String cronSecretToken;

    public ProductionSyncController(F1SyncScheduler syncScheduler) {
        this.syncScheduler = syncScheduler;
    }

    @GetMapping("/trigger")
    public ResponseEntity<String> triggerManualSync(@RequestParam("token") String token) {
        if (cronSecretToken == null || !cronSecretToken.equals(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Unauthorized: Invalid execution token.");
        }

        // Triggers the async thread instantly and immediately returns to the next line
        syncScheduler.syncDataPipeline();

        // Changed to .accepted() (HTTP 202) and updated message text
        return ResponseEntity.accepted()
                .body("F1 pipeline synchronization started in the background.");
    }
}