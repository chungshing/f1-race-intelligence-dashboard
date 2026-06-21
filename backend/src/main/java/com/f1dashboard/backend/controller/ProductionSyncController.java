package com.f1dashboard.backend.controller;

import com.f1dashboard.backend.service.F1SyncScheduler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/automation")
public class ProductionSyncController {

    private final F1SyncScheduler syncScheduler;

    @Value("${CRON_SECRET_TOKEN:local-dev-fallback}")
    private String cronSecretToken;

    public ProductionSyncController(F1SyncScheduler syncScheduler) {
        this.syncScheduler = syncScheduler;
    }

    @PostMapping("/trigger")
    public ResponseEntity<String> triggerManualSync(@RequestBody Map<String, String> payload) {
        String token = payload.get("token");

        if (cronSecretToken == null || !cronSecretToken.equals(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Unauthorized: Invalid execution token.");
        }

        // Triggers async pipeline execution instantly
        syncScheduler.syncDataPipeline();

        return ResponseEntity.accepted()
                .body("F1 pipeline synchronization started in the background.");
    }
}