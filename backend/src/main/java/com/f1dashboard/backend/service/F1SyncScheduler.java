package com.f1dashboard.backend.service;

import java.time.Year;
import java.util.List;
import java.util.Objects;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.f1dashboard.backend.model.DriverStanding;
import com.f1dashboard.backend.model.Lap;
import com.f1dashboard.backend.model.RaceResult;
import com.f1dashboard.backend.model.RaceWeekend;
import com.f1dashboard.backend.model.TeamStanding;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class F1SyncScheduler {

    private final OpenF1Service openF1Service;
    private final F1DataWriter dataWriter;

    public F1SyncScheduler(OpenF1Service openF1Service, F1DataWriter dataWriter) {
        this.openF1Service = openF1Service;
        this.dataWriter = dataWriter;
    }

    @Async
    public void syncDataPipeline() {
        log.info("Starting background F1 data sync...");
        //syncDriverStandings();
        //syncTeamStandings();
        List<RaceResult> currentWeekendResults = syncCalendarAndResults();
        syncLaps(currentWeekendResults);
        log.info("F1 background database update complete.");
    }

    public void syncDriverStandings() {
        try {
            List<DriverStanding> drivers = openF1Service.fetchDriverStandings();
            if (drivers != null && !drivers.isEmpty()) {
                dataWriter.writeDriverStandings(drivers);
                log.info("Successfully updated driver standings.");
            } else {
                log.warn("Driver standings API returned empty. Retaining existing database records.");
            }
        } catch (Exception e) {
            log.error("Driver standings sync failed, existing records untouched.", e);
        }
    }

    public void syncTeamStandings() {
        try {
            List<TeamStanding> teams = openF1Service.fetchTeamStandings();
            if (teams != null && !teams.isEmpty()) {
                dataWriter.writeTeamStandings(teams);
                log.info("Successfully updated team standings.");
            } else {
                log.warn("Team standings API returned empty. Retaining existing database records.");
            }
        } catch (Exception e) {
            log.error("Team standings sync failed, existing records untouched.", e);
        }
    }

    public List<RaceResult> syncCalendarAndResults() {
        try {
            int currentYear = Year.now().getValue();

            List<RaceWeekend> weekends = openF1Service.getCachedWeekends(currentYear);
            log.info("Calendar validation complete. Total weekends tracked: {}", weekends.size());

            List<RaceResult> weekendResults = openF1Service.getCachedWeekendResults(null);
            log.info("Successfully synchronized {} session classifications.", weekendResults.size());

            return weekendResults != null ? weekendResults : List.of();
        } catch (Exception e) {
            log.error("Calendar/results sync failed.", e);
            return List.of();
        }
    }

    public void syncLaps(List<RaceResult> currentWeekendResults) {
        try {
            if (currentWeekendResults == null || currentWeekendResults.isEmpty()) {
                log.warn("No current weekend results available. Skipping lap sync.");
                return;
            }

            List<Integer> currentSessionKeys = currentWeekendResults.stream()
                    .map(RaceResult::getSessionKey)
                    .filter(Objects::nonNull)
                    .toList();

            for (RaceResult result : currentWeekendResults) {
                String sessionName = result.getSessionName();
                if (sessionName != null && !sessionName.toLowerCase().contains("practice")
                        && result.getSessionKey() != null) {
                    List<Lap> lapsSynced = openF1Service.getCachedSessionLaps(result.getSessionKey());
                    log.info("Synced {} laps for {} (Key: {})", lapsSynced.size(), sessionName,
                            result.getSessionKey());
                }
            }

            dataWriter.evictStaleLaps(currentSessionKeys);
        } catch (Exception e) {
            log.error("Lap sync failed, existing lap records untouched.", e);
        }
    }
}