package com.f1dashboard.backend.service;

import com.f1dashboard.backend.dto.*;
import com.f1dashboard.backend.model.*;
import com.f1dashboard.backend.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.Year;
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
    private final DriverStandingRepository driverRepo;
    private final TeamStandingRepository teamRepo;

    public OpenF1Service(RestTemplate restTemplate,
            RaceWeekendRepository raceWeekendRepository,
            RaceResultRepository raceResultRepository, DriverStandingRepository driverRepo,
            TeamStandingRepository teamRepo) {
        this.restTemplate = restTemplate;
        this.raceWeekendRepository = raceWeekendRepository;
        this.raceResultRepository = raceResultRepository;
        this.driverRepo = driverRepo;
        this.teamRepo = teamRepo;
    }

    private void delayBetweenRequests() {
        try {
            Thread.sleep(2500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("API request delay spacing was interrupted");
        }
    }

    public List<RaceWeekend> getCachedWeekends(int year) {
        log.info("Validating race calendar for year {} with live data source...", year);
        List<RaceWeekend> liveWeekends = fetchRaceWeekends(year);

        if (!liveWeekends.isEmpty()) {
            raceWeekendRepository.deleteAllInBatch();
            raceWeekendRepository.saveAll(liveWeekends);
            return liveWeekends;
        }

        log.warn("Live calendar fetch was empty. Falling back to local records.");
        return raceWeekendRepository.findByYear(year);
    }

    @Transactional
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
                                s.getPositionStart() != null ? s.getPositionStart() : s.getPositionCurrent(),
                                s.getPositionsGained(),
                                d != null ? d.getFullName() : "Driver " + s.getDriverNumber(),
                                d != null ? d.getTeamName() : "Unknown",
                                s.getPointsCurrent(),
                                s.getPointsStart() != null ? s.getPointsStart() : s.getPointsCurrent(),
                                s.getPointsEarned(),
                                s.getDriverNumber(),
                                d != null ? d.getTeamColour() : "#999999",
                                d != null ? d.getHeadshotUrl() : null);
                    })
                    .sorted(Comparator.comparingInt(DriverStanding::getPosition))
                    .toList();
        } catch (RestClientException e) {
            log.warn(
                    "Driver standings unavailable due to OpenF1 race weekend restrictions. Loading cached data from DB.");

            // Fetch existing records from your database instead of returning empty
            return driverRepo.findAll().stream()
                    .sorted(Comparator.comparingInt(DriverStanding::getPosition))
                    .toList();
        }
    }

    @Transactional
    public List<TeamStanding> fetchTeamStandings() {
        try {
            String url = openF1BaseUrl + "/championship_teams?session_key=latest";
            delayBetweenRequests();
            OpenF1TeamChampionshipDto[] teams = restTemplate.getForObject(url, OpenF1TeamChampionshipDto[].class);

            if (teams == null || teams.length == 0)
                return List.of();

            return Arrays.stream(teams)
                    .map(t -> new TeamStanding(
                            t.getPositionCurrent(),
                            t.getPositionStart() != null ? t.getPositionStart() : t.getPositionCurrent(),
                            t.getPositionsGained(),
                            t.getTeamName(),
                            t.getPointsCurrent(),
                            t.getPointsStart() != null ? t.getPointsStart() : t.getPointsCurrent(),
                            t.getPointsEarned()))
                    .sorted(Comparator.comparingInt(TeamStanding::getPosition))
                    .toList();
        } catch (RestClientException e) {
            log.warn(
                    "Team standings unavailable due to OpenF1 race weekend restrictions. Loading cached data from DB.");

            // Fetch existing records from your database instead of returning empty
            return teamRepo.findAll().stream()
                    .sorted(Comparator.comparingInt(TeamStanding::getPosition))
                    .toList();
        }
    }

    public List<RaceWeekend> fetchRaceWeekends(int year) {
        try {
            // 1. Fetch OpenF1 Sessions
            String sessionUrl = openF1BaseUrl + "/sessions?year=" + year;
            delayBetweenRequests();
            OpenF1SessionDto[] sessions = restTemplate.getForObject(sessionUrl, OpenF1SessionDto[].class);

            if (sessions == null || sessions.length == 0)
                return List.of();

            // 2. Fetch OpenF1 Meetings to extract visual images
            String meetingUrl = openF1BaseUrl + "/meetings?year=" + year;
            delayBetweenRequests();
            OpenF1MeetingDto[] meetings = restTemplate.getForObject(meetingUrl, OpenF1MeetingDto[].class);

            // Map meetings by meeting_key for O(1) instant lookup
            Map<Integer, OpenF1MeetingDto> meetingMap = (meetings == null) ? Map.of()
                    : Arrays.stream(meetings)
                            .collect(Collectors.toMap(OpenF1MeetingDto::getMeeting_key, m -> m, (m1, m2) -> m1));

            // 3. Group sessions by meeting key exactly as you did before
            Map<Integer, List<OpenF1SessionDto>> grouped = Arrays.stream(sessions)
                    .collect(Collectors.groupingBy(OpenF1SessionDto::getMeeting_key));

            return grouped.entrySet().stream()
                    .map(entry -> {
                        List<OpenF1SessionDto> list = entry.getValue();
                        OpenF1SessionDto first = list.get(0);

                        // Grab the visuals from our map using the meeting key
                        OpenF1MeetingDto meetingDetails = meetingMap.get(entry.getKey());
                        String circuitImg = (meetingDetails != null) ? meetingDetails.getCircuit_image() : null;
                        String countryFlg = (meetingDetails != null) ? meetingDetails.getCountry_flag() : null;
                        String circuitTyp = (meetingDetails != null) ? meetingDetails.getCircuit_type() : null;

                        List<RaceSession> mappedSessions = list.stream()
                                .map(s -> new RaceSession(s.getSession_name(), s.getSession_type(), s.getDate_start(),
                                        s.getDate_end()))
                                .sorted(Comparator.comparing(RaceSession::getDateStart,
                                        Comparator.nullsLast(String::compareTo)))
                                .toList();

                        // Map down into our unified entity row
                        return new RaceWeekend(
                                entry.getKey(),
                                first.getCountry_name(),
                                first.getCircuit_short_name(),
                                year,
                                circuitImg,
                                countryFlg,
                                circuitTyp,
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
            log.error("Failed to fetch live race results for sessionKey: {}. Falling back to DB cache.", sessionKey, e);

            // If we have a specific sessionKey, look it up in the DB so we don't return an
            // empty list down the pipeline
            if (sessionKey != null) {
                return raceResultRepository.findById(sessionKey)
                        .map(List::of)
                        .orElse(List.of());
            }
            return List.of();
        }
    }

    @Transactional
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

            if (weekendSessions == null || weekendSessions.length == 0)
                return List.of();

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

            List<OpenF1SessionDto> completedSessions = Arrays.stream(weekendSessions)
                    .filter(s -> s.getDate_start() != null && s.getSession_key() != null)
                    .filter(s -> {
                        Instant sessionStart = OffsetDateTime.parse(s.getDate_start()).toInstant();
                        return sessionStart.isBefore(now);
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

            // FILTERING LAYER: Deduplicate by session_key before returning to cache
            // coordinator
            return allWeekendResults.stream()
                    .filter(Objects::nonNull)
                    .collect(Collectors.toMap(
                            RaceResult::getSessionKey, // Uses the proper camelCase getter
                            r -> r,
                            (existing, replacement) -> existing))
                    .values()
                    .stream()
                    .toList();

        } catch (Exception e) {
            log.error("Failed to compile weekend session results for meeting key: {}", meetingKey, e);
            return List.of();
        }
    }

    @Transactional
    public List<RaceResult> getCachedWeekendResults(Integer meetingKey) {
        if (meetingKey == null) {
            meetingKey = resolveLatestMeetingKey();
        }
        if (meetingKey == null) {
            return List.of();
        }

        // 1. Get current database state
        List<RaceResult> localRecords = raceResultRepository.findByMeetingKey(meetingKey);

        // 2. Fetch fresh session payloads from live endpoint
        List<RaceResult> liveResults = fetchWeekendSessionResults(meetingKey);

        // Safety fallback
        if (liveResults.isEmpty()) {
            log.warn("Live weekend results returned empty payload for meeting {}. Preserving local cache.", meetingKey);
            return localRecords;
        }

        // 3. Check for structural updates OR content changes
        boolean cacheNeedsRefresh = localRecords.size() != liveResults.size() || !localRecords.equals(liveResults);

        if (cacheNeedsRefresh) {
            log.info("Cache updates detected. Upserting fresh matrices to database...");

            // UPSERT STRATEGY: Save or update incoming rows without erasing old ones
            raceResultRepository.saveAllAndFlush(liveResults);

            // Fetch fresh state to ensure return structure contains all records combined
            return raceResultRepository.findByMeetingKey(meetingKey);
        }

        log.info("Cache validation check passed for active meeting key: {}", meetingKey);
        return localRecords;
    }

    private DriverResult mapDriverResult(OpenF1SessionResultDto dto) {
        if (dto == null)
            return null;

        // 1. Extract and format the raw value into a displayable string safely
        String latestGap = "0.0";
        Object rawGap = dto.getGap_to_leader();

        if (rawGap != null) {
            if (rawGap instanceof List<?>) {
                List<?> gapList = (List<?>) rawGap;
                if (!gapList.isEmpty()) {
                    Object lastElement = gapList.get(gapList.size() - 1);
                    latestGap = lastElement != null ? lastElement.toString() : "0.0";
                }
            } else {
                latestGap = rawGap.toString();
            }
        }

        // 2. Format numerical gaps slightly to make them look uniform (e.g., adding '+'
        // prefix)
        if (latestGap.matches("^\\d+\\.\\d+$")) {
            double numericGap = Double.parseDouble(latestGap);
            if (numericGap > 0) {
                latestGap = "+" + latestGap;
            }
        }

        boolean isDnf = (dto.getDnf() != null && dto.getDnf());
        boolean isDns = (dto.getDns() != null && dto.getDns());
        boolean isDsq = (dto.getDsq() != null && dto.getDsq());

        return new DriverResult(
                dto.getPosition(),
                dto.getDriver_number(),
                latestGap,
                isDnf,
                isDns,
                isDsq);
    }

    private Integer resolveLatestMeetingKey() {
        try {
            int currentYear = Year.now().getValue();
            String url = openF1BaseUrl + "/sessions?year=" + currentYear;
            OpenF1SessionDto[] sessions = restTemplate.getForObject(url, OpenF1SessionDto[].class);

            // If the current year has no sessions yet (e.g., off-season early in the year),
            // fallback to last year
            if (sessions == null || sessions.length == 0) {
                log.info("No sessions found for current year {}. Checking previous year...", currentYear);
                url = openF1BaseUrl + "/sessions?year=" + (currentYear - 1);
                sessions = restTemplate.getForObject(url, OpenF1SessionDto[].class);
            }

            if (sessions == null || sessions.length == 0)
                return null;

            Instant now = Instant.now();
            Integer latestKey = null;
            Instant latestTrackedTime = Instant.MIN;

            for (OpenF1SessionDto session : sessions) {
                if (session.getMeeting_key() == null || session.getDate_start() == null)
                    continue;

                Instant sessionStart = OffsetDateTime.parse(session.getDate_start()).toInstant();

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
                .map(s -> new DriverStanding(
                        s.getPositionCurrent(),
                        s.getPositionStart() != null ? s.getPositionStart() : s.getPositionCurrent(),
                        s.getPositionsGained(),
                        "Driver " + s.getDriverNumber(),
                        "Unknown",
                        s.getPointsCurrent(),
                        s.getPointsStart() != null ? s.getPointsStart() : s.getPointsCurrent(),
                        s.getPointsEarned(),
                        s.getDriverNumber(),
                        "#999999",
                        null))
                .toList();
    }
}