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

    // Injects a secret key from your Render environment variables
    @Value("${CRON_SECRET_TOKEN}")
    private String cronSecretToken;

    public ProductionSyncController(F1SyncScheduler syncScheduler) {
        this.syncScheduler = syncScheduler;
    }

    @GetMapping("/trigger")
    public ResponseEntity<String> triggerManualSync(@RequestParam("token") String token) {
        // Validate incoming token against your secret configuration
        if (cronSecretToken == null || !cronSecretToken.equals(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Unauthorized: Invalid execution token.");
        }

        syncScheduler.syncDataPipeline();
        return ResponseEntity.ok("F1 pipeline synchronization completed!");
    }
}