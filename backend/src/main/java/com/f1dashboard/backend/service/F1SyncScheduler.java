package com.f1dashboard.backend.service;

import com.f1dashboard.backend.model.*;
import com.f1dashboard.backend.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.util.List;

@Slf4j
@Service
public class F1SyncScheduler {

    private final OpenF1Service openF1Service;
    private final DriverStandingRepository driverRepo;
    private final TeamStandingRepository teamRepo;
    private final RaceWeekendRepository weekendRepo;

    public F1SyncScheduler(OpenF1Service openF1Service, DriverStandingRepository driverRepo,
            TeamStandingRepository teamRepo, RaceWeekendRepository weekendRepo) {
        this.openF1Service = openF1Service;
        this.driverRepo = driverRepo;
        this.teamRepo = teamRepo;
        this.weekendRepo = weekendRepo;
    }

    @Scheduled(cron = "0 0 0,12 * * ?") // Every 12 hours at midnight and noon  
    public void syncDataPipeline() {
        log.info("Starting background F1 data sync...");

        try {
            // 1. Sync Standings
            List<DriverStanding> drivers = openF1Service.fetchDriverStandings();
            if (!drivers.isEmpty())
                driverRepo.saveAll(drivers);

            spaceRequests();

            // 2. Sync Team Standings
            List<TeamStanding> teams = openF1Service.fetchTeamStandings();
            if (!teams.isEmpty())
                teamRepo.saveAll(teams);

            spaceRequests();

            // 3. Sync Calendar (Current Year 2026)
            List<RaceWeekend> weekends = openF1Service.fetchRaceWeekends(2026);
            if (!weekends.isEmpty()) {
                weekends.forEach(w -> w.setYear(2026));
                weekendRepo.saveAll(weekends);
            }

            spaceRequests();

            // 4. Sync ALL Weekend Session Results (Protected by database caching wrapper)
            List<RaceResult> weekendResults = openF1Service.getCachedWeekendResults(null);
            log.info("Successfully synchronized {} session classifications for this weekend.", weekendResults.size());

            log.info("F1 background database update complete.");
        } catch (Exception e) {
            log.error("Pipeline synchronization error encountered", e);
        }
    }

    private void spaceRequests() {
        try {
            Thread.sleep(2500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Sync sleep interval was interrupted");
        }
    }
}