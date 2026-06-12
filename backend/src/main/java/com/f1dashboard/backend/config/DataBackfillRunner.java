package com.f1dashboard.backend.config;

import com.f1dashboard.backend.dto.OpenF1SessionDto;
import com.f1dashboard.backend.model.RaceResult;
import com.f1dashboard.backend.model.RaceWeekend;
import com.f1dashboard.backend.repository.RaceResultRepository;
import com.f1dashboard.backend.repository.RaceWeekendRepository;
import com.f1dashboard.backend.service.OpenF1Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

// @Component // Uncomment to enable the backfill runner on application startup. Use with caution!
@SuppressWarnings("unused")
@Slf4j
public class DataBackfillRunner implements CommandLineRunner {

    private final OpenF1Service openF1Service;
    private final RestTemplate restTemplate;
    private final RaceResultRepository raceResultRepository;
    private final RaceWeekendRepository raceWeekendRepository;

    public DataBackfillRunner(OpenF1Service openF1Service,
            RestTemplate restTemplate,
            RaceResultRepository raceResultRepository,
            RaceWeekendRepository raceWeekendRepository) {
        this.openF1Service = openF1Service;
        this.restTemplate = restTemplate;
        this.raceResultRepository = raceResultRepository;
        this.raceWeekendRepository = raceWeekendRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        log.info(">>> Starting full historical season backfill for 2026...");

        try {
            // 1. Fetch AND Save the Season Calendar / Race Weekends
            // log.info("Backfilling 2026 season calendar and weekend structure...");
            // List<RaceWeekend> weekends = openF1Service.fetchRaceWeekends(2026);
            // if (!weekends.isEmpty()) {
            //     raceWeekendRepository.saveAll(weekends);
            //     log.info("Successfully persisted {} race weekends to the database.", weekends.size());
            // }

            // 2. Fetch historical session data
            String url = "https://api.openf1.org/v1/sessions?year=2026";
            OpenF1SessionDto[] sessions = restTemplate.getForObject(url, OpenF1SessionDto[].class);

            // if (sessions == null || sessions.length == 0) {
            //     log.warn("No historical sessions found for 2026.");
            //     return;
            // }

            log.info("Found {} total historical sessions to evaluate.", sessions.length);
            Instant now = Instant.now();

            // 3. Loop and evaluate sessions
            for (OpenF1SessionDto session : sessions) {
                Integer sessionKey = session.getSession_key();
                if (sessionKey == null) {
                    continue;
                }

                // Guard: Skip if already processed
                // if (raceResultRepository.existsById(sessionKey)) {
                //     log.debug("Skipping session {} - already backfilled.", sessionKey);
                //     continue;
                // }

                // Guard: Skip future sessions
                if (session.getDate_start() != null) {
                    try {
                        String ISOString = session.getDate_start().substring(0, 19);
                        LocalDateTime localStart = LocalDateTime.parse(ISOString);
                        Instant sessionStart = localStart.toInstant(ZoneOffset.UTC);

                        if (sessionStart.isAfter(now)) {
                            continue;
                        }
                    } catch (Exception dateEx) {
                        log.error("Failed to parse start date for session key {}.", sessionKey);
                    }
                }

                log.info("Backfilling missing data: {} - [Key: {}] ({})",
                        session.getCountry_name(), sessionKey, session.getSession_name());

                // Fetch AND Save the individual session results
                List<RaceResult> results = openF1Service.fetchRaceResults(sessionKey);
                if (!results.isEmpty()) {
                    raceResultRepository.saveAll(results);
                }

                Thread.sleep(2500);
            }

            log.info(">>> 2026 Season Session Backfill completed successfully!");
        } catch (Exception e) {
            log.error("Critical error during initial session backfill routine", e);
        }
    }
}