package com.f1dashboard.backend.service;

import java.time.OffsetDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
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
import com.f1dashboard.backend.repository.RaceResultRepository;
import com.f1dashboard.backend.repository.TeamStandingRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class F1SyncScheduler {

    private final OpenF1Service openF1Service;
    private final DriverStandingRepository driverRepo;
    private final TeamStandingRepository teamRepo;
    private final RaceResultRepository raceResultRepo;
    private final LapRepository lapRepo;

    @Value("${lap.retention.sessions:5}")
    private int lapRetentionSessionCount;

    public F1SyncScheduler(OpenF1Service openF1Service,
            DriverStandingRepository driverRepo,
            TeamStandingRepository teamRepo,
            RaceResultRepository raceResultRepo,
            LapRepository lapRepo) {
        this.openF1Service = openF1Service;
        this.driverRepo = driverRepo;
        this.teamRepo = teamRepo;
        this.raceResultRepo = raceResultRepo;
        this.lapRepo = lapRepo;
    }

    @Async
    public void syncDataPipeline() {
        log.info("Starting background F1 data sync...");
        syncDriverStandings();
        syncTeamStandings();
        List<RaceResult> currentWeekendResults = syncCalendarAndResults();
        syncLaps(currentWeekendResults);
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

            evictStaleLaps(currentSessionKeys);
        } catch (Exception e) {
            log.error("Lap sync failed, existing lap records untouched.", e);
        }
    }

    @Transactional
    public void evictStaleLaps(List<Integer> currentSessionKeys) {
        Map<Integer, String> sessionNames = raceResultRepo.findAll().stream()
                .filter(r -> r.getSessionKey() != null && r.getSessionName() != null)
                .collect(Collectors.toMap(RaceResult::getSessionKey, RaceResult::getSessionName, (a, b) -> a));

        List<Integer> retainedHistoricalSessions = lapRepo.findSessionKeysWithEarliestDate().stream()
                .map(row -> Map.entry((Integer) row[0], (OffsetDateTime) row[1]))
                .filter(entry -> !currentSessionKeys.contains(entry.getKey()))
                .filter(entry -> {
                    String name = sessionNames.get(entry.getKey());
                    return name != null && ("Race".equalsIgnoreCase(name) || "Sprint".equalsIgnoreCase(name));
                })
                .sorted(Map.Entry.<Integer, OffsetDateTime>comparingByValue().reversed())
                .limit(lapRetentionSessionCount)
                .map(Map.Entry::getKey)
                .toList();

        Set<Integer> retainedKeys = new HashSet<>(currentSessionKeys);
        retainedKeys.addAll(retainedHistoricalSessions);

        log.info("Evicting stale telemetry. Retaining current weekend plus {} historical race/sprint sessions.",
                retainedHistoricalSessions.size());
        lapRepo.deleteBySessionKeyNotIn(new ArrayList<>(retainedKeys));
    }
}