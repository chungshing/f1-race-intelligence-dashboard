package com.f1dashboard.backend.service;

import java.time.Year;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.f1dashboard.backend.dto.OpenF1DriverDto;
import com.f1dashboard.backend.model.DriverIdentity;
import com.f1dashboard.backend.model.DriverResult;
import com.f1dashboard.backend.model.DriverStanding;
import com.f1dashboard.backend.model.Lap;
import com.f1dashboard.backend.model.RaceResult;
import com.f1dashboard.backend.model.RaceWeekend;
import com.f1dashboard.backend.model.TeamStanding;
import com.f1dashboard.backend.repository.DriverIdentityRepository;
import com.f1dashboard.backend.repository.RaceResultRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class F1SyncScheduler {

    private static final String PLACEHOLDER_NAME = "^Driver \\d+$";

    private final OpenF1Service openF1Service;
    private final F1DataWriter dataWriter;
    private final DriverIdentityRepository identityRepo;
    private final RaceResultRepository raceResultRepo;

    public F1SyncScheduler(OpenF1Service openF1Service, F1DataWriter dataWriter,
            DriverIdentityRepository identityRepo, RaceResultRepository raceResultRepo) {
        this.openF1Service = openF1Service;
        this.dataWriter = dataWriter;
        this.identityRepo = identityRepo;
        this.raceResultRepo = raceResultRepo;
    }

    @Async
    public void syncDataPipeline() {
        log.info("Starting background F1 data sync...");
        List<RaceResult> currentWeekendResults = syncCalendarAndResults();
        syncDriverIdentities();
        syncDriverStandings();
        syncTeamStandings();
        syncLaps(currentWeekendResults);
        log.info("F1 background database update complete.");
    }

    /**
     * Learns names/teams for drivers missing from the latest session (substitutes),
     * using the
     * driver list of a past Race session they took part in. Only calls the API when
     * an unknown
     * driver number shows up in a stored race classification.
     */
    public void syncDriverIdentities() {
        try {
            List<RaceResult> races = raceResultRepo.findAll().stream()
                    .filter(r -> r.getSessionKey() != null && "Race".equalsIgnoreCase(r.getSessionName()))
                    .sorted(Comparator.comparing(RaceResult::getSessionKey).reversed())
                    .toList();

            Set<Integer> known = identityRepo.findAll().stream()
                    .map(DriverIdentity::getDriverNumber)
                    .collect(Collectors.toSet());

            Set<Integer> missing = new HashSet<>();
            for (RaceResult race : races) {
                for (DriverResult result : race.getClassification()) {
                    if (result.getDriverNumber() != null && !known.contains(result.getDriverNumber())) {
                        missing.add(result.getDriverNumber());
                    }
                }
            }

            for (RaceResult race : races) {
                if (missing.isEmpty()) {
                    break;
                }

                boolean hasMissing = race.getClassification().stream()
                        .anyMatch(r -> r.getDriverNumber() != null && missing.contains(r.getDriverNumber()));
                if (!hasMissing) {
                    continue;
                }

                List<DriverIdentity> found = new ArrayList<>();
                for (OpenF1DriverDto d : openF1Service.fetchDriversForSession(race.getSessionKey())) {
                    if (d.getDriverNumber() == null || d.getFullName() == null) {
                        continue;
                    }
                    found.add(new DriverIdentity(
                            d.getDriverNumber(),
                            d.getFullName(),
                            d.getTeamName() != null ? d.getTeamName() : "Unknown",
                            d.getTeamColour() != null ? d.getTeamColour() : "#999999",
                            d.getHeadshotUrl()));
                    missing.remove(d.getDriverNumber());
                }
                identityRepo.saveAll(found);
            }

            if (!missing.isEmpty()) {
                log.warn("No identity found for driver numbers {}. Backfill the meetings they raced in.", missing);
            }
        } catch (Exception e) {
            log.error("Driver identity sync failed, existing identities untouched.", e);
        }
    }

    public void syncDriverStandings() {
        try {
            List<DriverStanding> drivers = openF1Service.fetchDriverStandings();
            if (drivers != null && !drivers.isEmpty()) {
                applyIdentities(drivers);
                dataWriter.writeDriverStandings(drivers);
                log.info("Successfully updated driver standings.");
            } else {
                log.warn("Driver standings API returned empty. Retaining existing database records.");
            }
        } catch (Exception e) {
            log.error("Driver standings sync failed, existing records untouched.", e);
        }
    }

    /**
     * Remembers every real driver identity, and fills placeholder rows from what we
     * remember.
     */
    private void applyIdentities(List<DriverStanding> drivers) {
        Map<Integer, DriverIdentity> known = identityRepo.findAll().stream()
                .collect(Collectors.toMap(DriverIdentity::getDriverNumber, i -> i, (a, b) -> a));

        List<DriverIdentity> fresh = new ArrayList<>();
        for (DriverStanding d : drivers) {
            boolean placeholder = d.getDriverName() == null || d.getDriverName().matches(PLACEHOLDER_NAME);

            if (!placeholder) {
                fresh.add(new DriverIdentity(d.getDriverNumber(), d.getDriverName(), d.getTeamName(),
                        d.getTeamColor(), d.getHeadshotUrl()));
                continue;
            }

            DriverIdentity identity = known.get(d.getDriverNumber());
            if (identity != null) {
                d.setDriverName(identity.getDriverName());
                d.setTeamName(identity.getTeamName());
                d.setTeamColor(identity.getTeamColor());
                d.setHeadshotUrl(identity.getHeadshotUrl());
            }
        }

        if (!fresh.isEmpty()) {
            identityRepo.saveAll(fresh);
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

    @Async
    public void backfillMeeting(int meetingKey) {
        try {
            List<RaceResult> results = openF1Service.getCachedWeekendResults(meetingKey, true);

            if (results.isEmpty()) {
                log.warn("No results found for meeting {}", meetingKey);
                return;
            }

            int lapsSyncedCount = 0;
            for (RaceResult result : results) {
                String sessionName = result.getSessionName();
                if (sessionName != null && !sessionName.toLowerCase().contains("practice")
                        && result.getSessionKey() != null) {
                    List<Lap> laps = openF1Service.getCachedSessionLaps(result.getSessionKey());
                    lapsSyncedCount += laps.size();
                    log.info("Backfilled {} laps for {} (Key: {})", laps.size(), sessionName,
                            result.getSessionKey());
                }
            }

            log.info("Backfilled meeting {}: {} sessions, {} laps.", meetingKey, results.size(),
                    lapsSyncedCount);
        } catch (Exception e) {
            log.error("Backfill failed for meeting {}", meetingKey, e);
        }
    }
}