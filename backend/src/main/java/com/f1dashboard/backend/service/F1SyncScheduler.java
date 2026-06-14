package com.f1dashboard.backend.service;

import com.f1dashboard.backend.model.*;
import com.f1dashboard.backend.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.Year;
import java.util.List;

@Slf4j
@Service
public class F1SyncScheduler {

    private final OpenF1Service openF1Service;
    private final DriverStandingRepository driverRepo;
    private final TeamStandingRepository teamRepo;

    public F1SyncScheduler(OpenF1Service openF1Service,
            DriverStandingRepository driverRepo,
            TeamStandingRepository teamRepo) {
        this.openF1Service = openF1Service;
        this.driverRepo = driverRepo;
        this.teamRepo = teamRepo;
    }

    // Triggered externally via cronjob.org endpoint routing
    public void syncDataPipeline() {
        log.info("Starting background F1 data sync...");

        try {
            int currentYear = Year.now().getValue();

            // 1. Sync Driver Standings safely
            List<DriverStanding> drivers = openF1Service.fetchDriverStandings();
            if (drivers != null && !drivers.isEmpty()) {
                driverRepo.saveAll(drivers);
                log.info("Successfully updated driver standings.");
            } else {
                log.warn("Driver standings API returned empty. Retaining existing database records.");
            }

            // 2. Sync Team Standings safely
            List<TeamStanding> teams = openF1Service.fetchTeamStandings();
            if (teams != null && !teams.isEmpty()) {
                teamRepo.saveAll(teams);
                log.info("Successfully updated team standings.");
            } else {
                log.warn("Team standings API returned empty. Retaining existing database records.");
            }

            // 3. Sync Calendar via Service Cache
            List<RaceWeekend> weekends = openF1Service.getCachedWeekends(currentYear);
            log.info("Calendar validation complete. Total weekends tracked: {}", weekends.size());

            // 4. Sync Weekend Session Results
            List<RaceResult> weekendResults = openF1Service.getCachedWeekendResults(null);
            log.info("Successfully synchronized {} session classifications.", weekendResults.size());

            log.info("F1 background database update complete.");
        } catch (Exception e) {
            log.error("Pipeline synchronization error encountered", e);
        }
    }
}