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

@RestController
@RequestMapping("/api/v1/automation")
public class ProductionSyncController {

    private final F1SyncScheduler syncScheduler;

    @Value("${CRON_SECRET_TOKEN:}")
    private String cronSecretToken;

    public ProductionSyncController(F1SyncScheduler syncScheduler) {
        this.syncScheduler = syncScheduler;
    }

    private ResponseEntity<String> checkToken(Map<String, String> payload) {
        if (cronSecretToken == null || cronSecretToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("Sync endpoint not configured.");
        }

        if (!cronSecretToken.equals(payload.get("token"))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Unauthorized: Invalid execution token.");
        }

        return null;
    }

    @PostMapping("/trigger")
    public ResponseEntity<String> triggerManualSync(@RequestBody Map<String, String> payload) {
        ResponseEntity<String> denied = checkToken(payload);
        if (denied != null)
            return denied;

        syncScheduler.syncDataPipeline();

        return ResponseEntity.accepted()
                .body("F1 pipeline synchronization started in the background.");
    }

    @PostMapping("/backfill/{meetingKey}")
    public ResponseEntity<String> backfillMeeting(@PathVariable int meetingKey,
            @RequestBody Map<String, String> payload) {
        ResponseEntity<String> denied = checkToken(payload);
        if (denied != null)
            return denied;

        return ResponseEntity.ok(syncScheduler.backfillMeeting(meetingKey));
    }

    @PostMapping("/backfill-all")
    public ResponseEntity<String> backfillAll(@RequestBody Map<String, String> payload) {
        ResponseEntity<String> denied = checkToken(payload);
        if (denied != null)
            return denied;

        syncScheduler.backfillAllMeetings();

        return ResponseEntity.accepted()
                .body("Backfill of all past meetings started in the background. Watch the server logs for progress.");
    }
}