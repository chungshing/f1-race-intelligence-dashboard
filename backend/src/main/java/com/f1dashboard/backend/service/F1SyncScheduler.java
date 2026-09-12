package com.f1dashboard.backend.service;

import java.time.Year;
import java.util.List;
import java.util.Objects;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.f1dashboard.backend.model.DriverStanding;
import com.f1dashboard.backend.model.Lap;
import com.f1dashboard.backend.model.RaceResult;
import com.f1dashboard.backend.model.RaceWeekend;
import com.f1dashboard.backend.model.TeamStanding;
import com.f1dashboard.backend.repository.DriverStandingRepository;
import com.f1dashboard.backend.repository.LapRepository;
import com.f1dashboard.backend.repository.TeamStandingRepository;

import lombok.extern.slf4j.Slf4j;

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
    public void syncDataPipeline() {
        log.info("Starting background F1 data sync...");
        syncDriverStandings();
        syncTeamStandings();
        syncCalendarAndResults();
        log.info("F1 background database update complete.");
    }

    @Transactional
    public void syncDriverStandings() {
        try {
            List<DriverStanding> drivers = openF1Service.fetchDriverStandings();
            if (drivers != null && !drivers.isEmpty()) {
                driverRepo.saveAll(drivers);
                List<Integer> currentNumbers = drivers.stream().map(DriverStanding::getDriverNumber).toList();
                driverRepo.deleteAllByDriverNumberNotIn(currentNumbers);
                log.info("Successfully updated driver standings.");
            } else {
                log.warn("Driver standings API returned empty. Retaining existing database records.");
            }
        } catch (Exception e) {
            log.error("Driver standings sync failed, existing records untouched.", e);
        }
    }

    @Transactional
    public void syncTeamStandings() {
        try {
            List<TeamStanding> teams = openF1Service.fetchTeamStandings();
            if (teams != null && !teams.isEmpty()) {
                teamRepo.saveAll(teams);
                List<String> currentNames = teams.stream().map(TeamStanding::getTeamName).toList();
                teamRepo.deleteAllByTeamNameNotIn(currentNames);
                log.info("Successfully updated team standings.");
            } else {
                log.warn("Team standings API returned empty. Retaining existing database records.");
            }
        } catch (Exception e) {
            log.error("Team standings sync failed, existing records untouched.", e);
        }
    }

    public void syncCalendarAndResults() {
        try {
            int currentYear = Year.now().getValue();

            List<RaceWeekend> weekends = openF1Service.getCachedWeekends(currentYear);
            log.info("Calendar validation complete. Total weekends tracked: {}", weekends.size());

            List<RaceResult> weekendResults = openF1Service.getCachedWeekendResults(null);
            log.info("Successfully synchronized {} session classifications.", weekendResults.size());

            if (weekendResults != null && !weekendResults.isEmpty()) {
                List<Integer> currentSessionKeys = weekendResults.stream()
                        .map(RaceResult::getSessionKey)
                        .filter(Objects::nonNull)
                        .toList();

                if (!currentSessionKeys.isEmpty()) {
                    log.info("Evicting old weekend telemetry data to preserve free Supabase limits...");
                    lapRepo.deleteBySessionKeyNotIn(currentSessionKeys);
                }

                for (RaceResult result : weekendResults) {
                    String sessionName = result.getSessionName();
                    if (sessionName != null && !sessionName.toLowerCase().contains("practice")
                            && result.getSessionKey() != null) {
                        List<Lap> lapsSynced = openF1Service.getCachedSessionLaps(result.getSessionKey());
                        log.info("Synced {} laps for {} (Key: {})", lapsSynced.size(), sessionName,
                                result.getSessionKey());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Calendar/results sync failed.", e);
        }
    }
}