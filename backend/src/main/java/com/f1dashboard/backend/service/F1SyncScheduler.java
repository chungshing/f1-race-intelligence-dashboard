package com.f1dashboard.backend.service;

import java.time.OffsetDateTime;
import java.time.Year;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicBoolean;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.f1dashboard.backend.model.DriverStanding;
import com.f1dashboard.backend.model.Lap;
import com.f1dashboard.backend.model.RaceResult;
import com.f1dashboard.backend.model.RaceWeekend;
import com.f1dashboard.backend.model.TeamStanding;
import com.f1dashboard.backend.repository.RaceWeekendRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class F1SyncScheduler {

    private final OpenF1Service openF1Service;
    private final F1DataWriter dataWriter;
    private final RaceWeekendRepository raceWeekendRepository;
    private final AtomicBoolean backfillRunning = new AtomicBoolean(false);

    public F1SyncScheduler(OpenF1Service openF1Service, F1DataWriter dataWriter,
            RaceWeekendRepository raceWeekendRepository) {
        this.openF1Service = openF1Service;
        this.dataWriter = dataWriter;
        this.raceWeekendRepository = raceWeekendRepository;
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

    public String backfillMeeting(int meetingKey) {
        return backfillMeeting(meetingKey, true);
    }

    public String backfillMeeting(int meetingKey, boolean includeLaps) {
        List<RaceResult> results = openF1Service.getCachedWeekendResults(meetingKey);

        if (results.isEmpty()) {
            return "No results found for meeting " + meetingKey;
        }

        int lapsSyncedCount = 0;
        if (includeLaps) {
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
        }

        return String.format("Backfilled meeting %d: %d sessions, %d laps.", meetingKey, results.size(),
                lapsSyncedCount);
    }

    @Async
    public void backfillAllMeetings() {
        if (!backfillRunning.compareAndSet(false, true)) {
            log.warn("Backfill-all is already running. Ignoring this request.");
            return;
        }

        try {
            OffsetDateTime now = OffsetDateTime.now();

            List<Integer> meetingKeys = raceWeekendRepository.findByYear(Year.now().getValue()).stream()
                    .filter(w -> w.getSessions().stream()
                            .anyMatch(s -> s.getDateStart() != null
                                    && OffsetDateTime.parse(s.getDateStart()).isBefore(now)))
                    .map(RaceWeekend::getMeetingKey)
                    .sorted()
                    .toList();

            log.info("Backfill-all started for {} meetings (laps skipped).", meetingKeys.size());

            int done = 0;
            for (Integer meetingKey : meetingKeys) {
                done++;
                try {
                    String summary = backfillMeeting(meetingKey, false);
                    log.info("Backfill {}/{}: {}", done, meetingKeys.size(), summary);
                } catch (Exception e) {
                    log.error("Backfill {}/{} failed for meeting {}", done, meetingKeys.size(), meetingKey, e);
                }
            }

            log.info("Backfill-all finished.");
        } finally {
            backfillRunning.set(false);
        }
    }
}