package com.f1dashboard.backend.controller;

import com.f1dashboard.backend.service.F1SyncScheduler;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Profile("dev")
@RestController
@RequestMapping("/api/dev")
public class DevSyncController {

    private final F1SyncScheduler syncScheduler;

    public DevSyncController(F1SyncScheduler syncScheduler) {
        this.syncScheduler = syncScheduler;
    }

    @GetMapping("/force-sync")
    public String triggerManualSync() {
        // Explicitly executes the internal data pipeline code on command
        syncScheduler.syncDataPipeline();
        return "F1 background pipeline synchronization manually triggered!";
    }
}