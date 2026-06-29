package com.f1dashboard.backend.service;

import com.f1dashboard.backend.model.*;
import com.f1dashboard.backend.repository.*;
import lombok.extern.slf4j.Slf4j;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Year;
import java.util.List;
import java.util.Objects;

@Slf4j
@Service
public class F1SyncScheduler {

    private final OpenF1Service openF1Service;
    private final DriverStandingRepository driverRepo;
    private final TeamStandingRepository teamRepo;
    private final LapRepository lapRepo;

    public F1SyncScheduler(OpenF1Service openF1Service,
            DriverStandingRepository driverRepo,
            TeamStandingRepository teamRepo,
            LapRepository lapRepo) {
        this.openF1Service = openF1Service;
        this.driverRepo = driverRepo;
        this.teamRepo = teamRepo;
        this.lapRepo = lapRepo;
    }

    @Async
    @Transactional
    public void syncDataPipeline() {
        log.info("Starting background F1 data sync...");

        try {
            int currentYear = Year.now().getValue();

            // 1. Sync Driver Standings
            List<DriverStanding> drivers = openF1Service.fetchDriverStandings();
            if (drivers != null && !drivers.isEmpty()) {
                driverRepo.deleteAllInBatch();
                driverRepo.saveAll(drivers);
                log.info("Successfully updated driver standings.");
            } else {
                log.warn("Driver standings API returned empty. Retaining existing database records.");
            }

            // 2. Sync Team Standings
            List<TeamStanding> teams = openF1Service.fetchTeamStandings();
            if (teams != null && !teams.isEmpty()) {
                teamRepo.deleteAllInBatch();
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

            // 5. Sync Lap Telemetry ONLY for competitive sessions
            if (weekendResults != null && !weekendResults.isEmpty()) {

                List<Integer> currentSessionKeys = weekendResults.stream()
                        .map(RaceResult::getSessionKey)
                        .filter(Objects::nonNull)
                        .toList();

                if (!currentSessionKeys.isEmpty()) {
                    log.info("Evicting old weekend telemetry data to preserve free Supabase limits...");
                    log.info("Retaining laps for {} sessions: {}", currentSessionKeys.size(), currentSessionKeys);
                    lapRepo.deleteBySessionKeyNotIn(currentSessionKeys);
                }

                boolean anySynced = false;

                for (RaceResult result : weekendResults) {
                    String sessionName = result.getSessionName();

                    if (sessionName != null && !sessionName.toLowerCase().contains("practice")) {
                        if (result.getSessionKey() != null) {
                            int before = lapRepo.findByIdSessionKey(result.getSessionKey()).size();
                            List<Lap> lapsSynced = openF1Service.getCachedSessionLaps(result.getSessionKey());
                            if (lapsSynced.size() != before) {
                                if (!anySynced) {
                                    log.info("Starting fresh lap telemetry synchronization...");
                                    anySynced = true;
                                }
                                log.info("Synced {} laps for {} (Key: {})", lapsSynced.size(), sessionName,
                                        result.getSessionKey());
                            }
                        }
                    }
                }
            }

            log.info("F1 background database update complete.");
        } catch (Exception e) {
            log.error("Pipeline synchronization error encountered", e);
        }
    }
}