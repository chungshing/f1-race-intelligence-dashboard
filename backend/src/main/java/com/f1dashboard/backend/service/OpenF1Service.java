package com.f1dashboard.backend.service;

import com.f1dashboard.backend.dto.*;
import com.f1dashboard.backend.model.*;
import com.f1dashboard.backend.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class OpenF1Service {

    @Value("${openf1.api.baseUrl:https://api.openf1.org/v1}")
    private String openF1BaseUrl;

    private final RestTemplate restTemplate;
    private final RaceWeekendRepository raceWeekendRepository;
    private final RaceResultRepository raceResultRepository;

    public OpenF1Service(RestTemplate restTemplate,
            RaceWeekendRepository raceWeekendRepository,
            RaceResultRepository raceResultRepository) {
        this.restTemplate = restTemplate;
        this.raceWeekendRepository = raceWeekendRepository;
        this.raceResultRepository = raceResultRepository;
    }

    // =========================================================
    // RATE LIMITING HELPER
    // =========================================================
    private void delayBetweenRequests() {
        try {
            Thread.sleep(2500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("API request delay spacing was interrupted");
        }
    }

    // =========================================================
    // DATABASE LOOKUP FALLBACKS
    // =========================================================
    public List<RaceWeekend> getCachedWeekends(int year) {
        List<RaceWeekend> records = raceWeekendRepository.findByYear(year);
        if (records.isEmpty()) {
            log.info("No weekends found in database for year {}. Fetching live from OpenF1...", year);
            return fetchRaceWeekends(year);
        }
        return records;
    }

    public List<RaceResult> getCachedResults(Integer sessionKey) {
        if (sessionKey != null) {
            return raceResultRepository.findById(sessionKey)
                    .map(List::of)
                    .orElseGet(() -> {
                        log.info("No result found in database for session {}. Fetching live...", sessionKey);
                        return fetchRaceResults(sessionKey);
                    });
        }

        List<RaceResult> records = raceResultRepository.findAll();
        if (records.isEmpty()) {
            log.info("No race results found in database. Fetching latest live from OpenF1...");
            return fetchRaceResults(null);
        }
        return records;
    }

    // =========================================================
    // DRIVER STANDINGS
    // =========================================================
    public List<DriverStanding> fetchDriverStandings() {
        try {
            String championshipUrl = openF1BaseUrl + "/championship_drivers?session_key=latest";
            String driversUrl = openF1BaseUrl + "/drivers?session_key=latest";

            delayBetweenRequests();
            OpenF1ChampionshipDto[] standings = restTemplate.getForObject(championshipUrl,
                    OpenF1ChampionshipDto[].class);

            delayBetweenRequests();
            OpenF1DriverDto[] drivers = restTemplate.getForObject(driversUrl, OpenF1DriverDto[].class);

            if (standings == null || standings.length == 0)
                return List.of();
            if (drivers == null || drivers.length == 0)
                return mapWithoutEnrichment(standings);

            Map<Integer, OpenF1DriverDto> driverMap = Arrays.stream(drivers)
                    .collect(Collectors.toMap(OpenF1DriverDto::getDriverNumber, d -> d, (a, b) -> a));

            return Arrays.stream(standings)
                    .map(s -> {
                        OpenF1DriverDto d = driverMap.get(s.getDriverNumber());
                        return new DriverStanding(
                                s.getPositionCurrent(),
                                d != null ? d.getFullName() : "Driver " + s.getDriverNumber(),
                                d != null ? d.getTeamName() : "Unknown",
                                s.getPointsCurrent(),
                                s.getDriverNumber(),
                                d != null ? d.getTeamColour() : "#999999",
                                d != null ? d.getHeadshotUrl() : null);
                    })
                    .sorted(Comparator.comparingInt(DriverStanding::getPosition))
                    .toList();
        } catch (RestClientException e) {
            log.warn("Driver standings unavailable (OpenF1 restriction)");
            return List.of();
        }
    }

    // =========================================================
    // TEAM STANDINGS
    // =========================================================
    public List<TeamStanding> fetchTeamStandings() {
        try {
            String url = openF1BaseUrl + "/championship_teams?session_key=latest";
            delayBetweenRequests();
            OpenF1TeamChampionshipDto[] teams = restTemplate.getForObject(url, OpenF1TeamChampionshipDto[].class);

            if (teams == null || teams.length == 0)
                return List.of();

            return Arrays.stream(teams)
                    .map(t -> new TeamStanding(t.getPosition_current(), t.getTeam_name(), t.getPoints_current()))
                    .sorted(Comparator.comparingInt(TeamStanding::getPosition))
                    .toList();
        } catch (RestClientException e) {
            log.warn("Team standings unavailable");
            return List.of();
        }
    }

    // =========================================================
    // RACE WEEKENDS (CALENDAR)
    // =========================================================
    public List<RaceWeekend> fetchRaceWeekends(int year) {
        try {
            String url = openF1BaseUrl + "/sessions?year=" + year;
            delayBetweenRequests();
            OpenF1SessionDto[] sessions = restTemplate.getForObject(url, OpenF1SessionDto[].class);

            if (sessions == null || sessions.length == 0)
                return List.of();

            Map<Integer, List<OpenF1SessionDto>> grouped = Arrays.stream(sessions)
                    .collect(Collectors.groupingBy(OpenF1SessionDto::getMeeting_key));

            return grouped.entrySet().stream()
                    .map(entry -> {
                        List<OpenF1SessionDto> list = entry.getValue();
                        OpenF1SessionDto first = list.get(0);

                        List<RaceSession> mappedSessions = list.stream()
                                .map(s -> new RaceSession(s.getSession_name(), s.getSession_type(), s.getDate_start(),
                                        s.getDate_end()))
                                .sorted(Comparator.comparing(RaceSession::getDateStart,
                                        Comparator.nullsLast(String::compareTo)))
                                .toList();

                        return new RaceWeekend(
                                entry.getKey(),
                                first.getCountry_name(),
                                first.getCircuit_short_name(),
                                year,
                                mappedSessions);
                    })
                    .sorted(Comparator.comparing(w -> w.getSessions().stream()
                            .map(RaceSession::getDateStart)
                            .filter(Objects::nonNull)
                            .min(String::compareTo)
                            .orElse("9999-12-31")))
                    .toList();
        } catch (Exception e) {
            log.warn("Race calendar unavailable", e);
            return List.of();
        }
    }

    // =========================================================
    // RACE RESULTS ENTRY POINT
    // =========================================================
    public List<RaceResult> fetchRaceResults(Integer sessionKey) {
        try {
            String targetsKey = (sessionKey != null) ? String.valueOf(sessionKey) : "latest";

            delayBetweenRequests();
            String url = openF1BaseUrl + "/sessions?session_key=" + targetsKey;
            OpenF1SessionDto[] sessions = restTemplate.getForObject(url, OpenF1SessionDto[].class);

            if (sessions == null || sessions.length == 0)
                return List.of();

            OpenF1SessionDto activeSession = Arrays.stream(sessions)
                    .filter(s -> s.getDate_start() != null)
                    .max(Comparator.comparing(OpenF1SessionDto::getDate_start))
                    .orElse(sessions[0]);

            Integer activeKey = activeSession.getSession_key();

            delayBetweenRequests();
            OpenF1SessionResultDto[] res = restTemplate.getForObject(
                    openF1BaseUrl + "/session_result?session_key=" + activeKey,
                    OpenF1SessionResultDto[].class);

            if (res == null || res.length == 0)
                return List.of();

            List<DriverResult> driverResults = Arrays.stream(res)
                    .map(this::mapDriverResult)
                    .filter(Objects::nonNull)
                    .sorted(Comparator.comparing(DriverResult::getPosition, Comparator.nullsLast(Integer::compareTo)))
                    .collect(Collectors.toList());

            RaceResult result = new RaceResult(
                    activeSession.getMeeting_key(),
                    activeKey,
                    activeSession.getCountry_name(),
                    activeSession.getSession_name(),
                    driverResults);

            return List.of(result);
        } catch (Exception e) {
            log.error("Failed to fetch race results for sessionKey: {}", sessionKey, e);
            return List.of();
        }
    }

    // =========================================================
    // FETCH ALL SESSION RESULTS FOR A WEEKEND
    // =========================================================
    public List<RaceResult> fetchWeekendSessionResults(Integer meetingKey) {
        try {
            String sessionsUrl = openF1BaseUrl + "/sessions";
            if (meetingKey == null) {
                sessionsUrl += "?session_key=latest";
            } else {
                sessionsUrl += "?meeting_key=" + meetingKey;
            }

            delayBetweenRequests();
            OpenF1SessionDto[] weekendSessions = restTemplate.getForObject(sessionsUrl, OpenF1SessionDto[].class);

            if (weekendSessions == null || weekendSessions.length == 0) {
                return List.of();
            }

            Integer targetMeetingKey = (meetingKey != null) ? meetingKey : weekendSessions[0].getMeeting_key();

            if (meetingKey == null) {
                delayBetweenRequests();
                weekendSessions = restTemplate.getForObject(
                        openF1BaseUrl + "/sessions?meeting_key=" + targetMeetingKey,
                        OpenF1SessionDto[].class);
            }

            if (weekendSessions == null)
                return List.of();

            List<RaceResult> allWeekendResults = new ArrayList<>();
            Instant now = Instant.now();

            // Guard: Sort and filter out future/cancelled sessions before calling the API
            List<OpenF1SessionDto> completedSessions = Arrays.stream(weekendSessions)
                    .filter(s -> s.getDate_start() != null && s.getSession_key() != null)
                    .filter(s -> {
                        LocalDateTime localStart = LocalDateTime.parse(s.getDate_start().substring(0, 19));
                        return localStart.toInstant(ZoneOffset.UTC).isBefore(now);
                    })
                    .sorted(Comparator.comparing(OpenF1SessionDto::getDate_start))
                    .toList();

            for (OpenF1SessionDto session : completedSessions) {
                log.info("Fetching classification results for completed session: {} (Key: {})",
                        session.getSession_name(), session.getSession_key());

                List<RaceResult> sessionResult = fetchRaceResults(session.getSession_key());
                if (!sessionResult.isEmpty()) {
                    allWeekendResults.addAll(sessionResult);
                }
            }

            return allWeekendResults;
        } catch (Exception e) {
            log.error("Failed to compile weekend session results for meeting key: {}", meetingKey, e);
            return List.of();
        }
    }

    public List<RaceResult> getCachedWeekendResults(Integer meetingKey) {
        if (meetingKey == null) {
            meetingKey = resolveLatestMeetingKey();
        }
        if (meetingKey == null)
            return List.of();

        List<RaceResult> records = raceResultRepository.findByMeetingKey(meetingKey);

        if (records.size() >= 5) {
            log.info("Cache hit! Entire weekend is complete with {} sessions recorded.", records.size());
            return records;
        }

        log.info("Weekend active/incomplete (Stored: {}/5). Checking OpenF1 for updates...", records.size());
        List<RaceResult> liveResults = fetchWeekendSessionResults(meetingKey);

        if (!liveResults.isEmpty()) {
            raceResultRepository.saveAll(liveResults);
        }

        return liveResults;
    }

    // =========================================================
    // HELPER MAPPERS
    // =========================================================
    private DriverResult mapDriverResult(OpenF1SessionResultDto dto) {
        if (dto == null)
            return null;

        List<Double> gaps = normalize(dto.getGap_to_leader());
        Double latestGap = (gaps == null || gaps.isEmpty()) ? 0.0 : gaps.get(gaps.size() - 1);

        boolean dnf = false;
        boolean dns = false;
        boolean dsq = false;

        return new DriverResult(
                dto.getPosition(),
                dto.getDriver_number(),
                latestGap,
                dnf,
                dns,
                dsq);
    }

    private List<Double> normalize(Object value) {
        if (value == null)
            return List.of();
        if (value instanceof List<?> list) {
            return list.stream()
                    .filter(Objects::nonNull)
                    .filter(Number.class::isInstance)
                    .map(v -> ((Number) v).doubleValue())
                    .toList();
        }
        if (value instanceof Number num) {
            return List.of(num.doubleValue());
        }
        return List.of();
    }

    private Integer resolveLatestMeetingKey() {
        try {
            String url = openF1BaseUrl + "/sessions?year=2026";
            OpenF1SessionDto[] sessions = restTemplate.getForObject(url, OpenF1SessionDto[].class);
            if (sessions == null || sessions.length == 0)
                return null;

            Instant now = Instant.now();
            Integer latestKey = null;
            Instant latestTrackedTime = Instant.MIN;

            for (OpenF1SessionDto session : sessions) {
                if (session.getMeeting_key() == null || session.getDate_start() == null)
                    continue;

                // substring(0, 19) handles timestamps with variable tail fractions safely
                LocalDateTime localStart = LocalDateTime.parse(session.getDate_start().substring(0, 19));
                Instant sessionStart = localStart.toInstant(ZoneOffset.UTC);

                if (sessionStart.isBefore(now) && sessionStart.isAfter(latestTrackedTime)) {
                    latestTrackedTime = sessionStart;
                    latestKey = session.getMeeting_key();
                }
            }
            return latestKey;
        } catch (Exception e) {
            log.error("Error encountered while resolving the latest active meeting key", e);
            return null;
        }
    }

    private List<DriverStanding> mapWithoutEnrichment(OpenF1ChampionshipDto[] standings) {
        return Arrays.stream(standings)
                .map(s -> new DriverStanding(s.getPositionCurrent(), "Driver " + s.getDriverNumber(), "Unknown",
                        s.getPointsCurrent(), s.getDriverNumber(), "#999999", null))
                .toList();
    }
}