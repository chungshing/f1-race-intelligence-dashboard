package com.f1dashboard.backend.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.f1dashboard.backend.service.F1SyncScheduler;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/automation")
public class ProductionSyncController {

    private final F1SyncScheduler syncScheduler;

    @Value("${CRON_SECRET_TOKEN:}")
    private String cronSecretToken;

    public ProductionSyncController(F1SyncScheduler syncScheduler) {
        this.syncScheduler = syncScheduler;
    }

    @PostMapping("/trigger")
    public ResponseEntity<String> triggerManualSync(@RequestBody Map<String, String> payload) {
        if (cronSecretToken == null || cronSecretToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("Sync endpoint not configured.");
        }

        String token = payload.get("token");

        if (!cronSecretToken.equals(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Unauthorized: Invalid execution token.");
        }

        syncScheduler.syncDataPipeline();

        return ResponseEntity.accepted()
                .body("F1 pipeline synchronization started in the background.");
    }

    @PostMapping("/backfill/{meetingKey}")
    public ResponseEntity<String> backfillMeeting(@PathVariable int meetingKey,
            @RequestBody Map<String, String> payload) {
        String token = payload.get("token");
        log.info("RECEIVED TOKEN: [{}], EXPECTED TOKEN: [{}]", token, cronSecretToken);

        if (cronSecretToken == null || cronSecretToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("Sync endpoint not configured.");
        }

        if (!cronSecretToken.equals(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Unauthorized: Invalid execution token.");
        }

        String result = syncScheduler.backfillMeeting(meetingKey);
        return ResponseEntity.ok(result);
    }
}