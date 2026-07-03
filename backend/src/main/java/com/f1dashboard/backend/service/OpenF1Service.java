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
    private final LapRepository lapRepository;

    public OpenF1Service(RestTemplate restTemplate,
            RaceWeekendRepository raceWeekendRepository,
            RaceResultRepository raceResultRepository,
            DriverStandingRepository driverRepo,
            TeamStandingRepository teamRepo,
            LapRepository lapRepository) {
        this.restTemplate = restTemplate;
        this.raceWeekendRepository = raceWeekendRepository;
        this.raceResultRepository = raceResultRepository;
        this.driverRepo = driverRepo;
        this.teamRepo = teamRepo;
        this.lapRepository = lapRepository;
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

            boolean isPractice = activeSession.getSession_name() != null &&
                    activeSession.getSession_name().toLowerCase().contains("practice");

            // 1. Fetch Classifications (always)
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

            // 2. Fetch Pit Stops (non-practice only)
            List<PitStop> pitStopsList = new ArrayList<>();
            if (!isPractice) {
                try {
                    delayBetweenRequests();
                    String pitUrl = openF1BaseUrl + "/pit?session_key=" + activeKey;
                    PitStop[] fetchedPits = restTemplate.getForObject(pitUrl, PitStop[].class);
                    if (fetchedPits != null) {
                        pitStopsList = Arrays.asList(fetchedPits);
                    }
                } catch (Exception e) {
                    log.warn("Pit stops data empty or unavailable for session key: {}", activeKey);
                }
            }

            // 3. Fetch Stints (non-practice only)
            List<Stint> stintsList = new ArrayList<>();
            if (!isPractice) {
                try {
                    delayBetweenRequests();
                    String stintUrl = openF1BaseUrl + "/stints?session_key=" + activeKey;
                    Stint[] fetchedStints = restTemplate.getForObject(stintUrl, Stint[].class);
                    if (fetchedStints != null) {
                        stintsList = Arrays.asList(fetchedStints);
                    }
                } catch (Exception e) {
                    log.warn("Stints data empty or unavailable for session key: {}", activeKey);
                }
            }

            // 4. Fetch Weather (always)
            List<WeatherSnapshot> weatherList = new ArrayList<>();
            try {
                delayBetweenRequests();
                String weatherUrl = openF1BaseUrl + "/weather?session_key=" + activeKey;
                OpenF1WeatherDto[] fetchedWeather = restTemplate.getForObject(weatherUrl, OpenF1WeatherDto[].class);
                if (fetchedWeather != null) {
                    weatherList = Arrays.stream(fetchedWeather)
                            .map(w -> new WeatherSnapshot(
                                    w.getDate(),
                                    w.getAir_temperature(),
                                    w.getTrack_temperature(),
                                    w.getHumidity(),
                                    w.getPressure(),
                                    w.getRainfall(),
                                    w.getWind_direction(),
                                    w.getWind_speed()))
                            .toList();
                }
            } catch (Exception e) {
                log.warn("Weather data unavailable for session key: {}", activeKey);
            }

            // 5. Construct complete, enriched entity directly
            RaceResult result = new RaceResult(
                    activeSession.getMeeting_key(),
                    activeKey,
                    activeSession.getCountry_name(),
                    activeSession.getSession_name(),
                    driverResults,
                    pitStopsList,
                    stintsList,
                    weatherList);

            return List.of(result);

        } catch (Exception e) {
            log.error("Failed to fetch live race results for sessionKey: {}. Falling back to DB cache.", sessionKey, e);

            if (sessionKey != null) {
                return raceResultRepository.findById(sessionKey)
                        .map(List::of)
                        .orElse(List.of());
            }
            return List.of();
        }
    }

    @Transactional
    public List<RaceResult> fetchWeekendSessionResults(int meetingKey) {
        try {
            String sessionsUrl = openF1BaseUrl + "/sessions?meeting_key=" + meetingKey;

            delayBetweenRequests();
            OpenF1SessionDto[] weekendSessions = restTemplate.getForObject(sessionsUrl, OpenF1SessionDto[].class);

            if (weekendSessions == null || weekendSessions.length == 0)
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

                long start = System.currentTimeMillis();
                List<RaceResult> sessionResult = fetchRaceResults(session.getSession_key());
                log.info("Session {} (Key: {}) fetch took {}ms",
                        session.getSession_name(), session.getSession_key(),
                        System.currentTimeMillis() - start);

                if (!sessionResult.isEmpty()) {
                    allWeekendResults.addAll(sessionResult);
                }
            }

            // Deduplicate by session_key before returning
            return allWeekendResults.stream()
                    .filter(Objects::nonNull)
                    .collect(Collectors.toMap(
                            RaceResult::getSessionKey,
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
        Set<Integer> localKeys = localRecords.stream().map(RaceResult::getSessionKey).collect(Collectors.toSet());
        Set<Integer> liveKeys = liveResults.stream().map(RaceResult::getSessionKey).collect(Collectors.toSet());
        boolean cacheNeedsRefresh = !localKeys.equals(liveKeys);

        if (cacheNeedsRefresh) {
            log.info("Cache updates detected. Upserting fresh matrices to database...");

            // UPSERT STRATEGY: Update existing rows correctly by mapping arrays to old
            // records
            for (RaceResult live : liveResults) {
                raceResultRepository.findById(live.getSessionKey()).ifPresent(local -> {
                    // Retain lists across background updates
                    if (live.getPitStops() == null || live.getPitStops().isEmpty()) {
                        live.setPitStops(local.getPitStops());
                    }
                    if (live.getStints() == null || live.getStints().isEmpty()) {
                        live.setStints(local.getStints());
                    }
                });
            }

            raceResultRepository.saveAllAndFlush(liveResults);
            return raceResultRepository.findByMeetingKey(meetingKey);
        }

        log.info("Cache validation check passed for active meeting key: {}", meetingKey);
        return localRecords;
    }

    @Transactional
    public List<Lap> fetchSessionLapTelemetry(int sessionKey) {
        try {
            String url = openF1BaseUrl + "/laps?session_key=" + sessionKey;
            log.info("Ingesting session telemetry payload from OpenF1: {}", url);

            delayBetweenRequests();
            OpenF1LapDto[] rawLaps = restTemplate.getForObject(url, OpenF1LapDto[].class);

            if (rawLaps == null || rawLaps.length == 0) {
                log.warn("Payload empty for session key: {}", sessionKey);
                return List.of();
            }

            List<Lap> mappedLaps = Arrays.stream(rawLaps)
                    .filter(Objects::nonNull)
                    .map(dto -> new Lap(
                            dto.getSession_key(),
                            dto.getDriver_number(),
                            dto.getLap_number(),
                            dto.getMeeting_key(),
                            dto.getDate_start() != null ? OffsetDateTime.parse(dto.getDate_start()) : null,
                            dto.getDuration_sector_1(),
                            dto.getDuration_sector_2(),
                            dto.getDuration_sector_3(),
                            dto.getLap_duration(),
                            dto.getI1_speed(),
                            dto.getI2_speed(),
                            dto.getSt_speed(),
                            dto.getIs_pit_out_lap() != null && dto.getIs_pit_out_lap(),
                            dto.getSegments_sector_1(),
                            dto.getSegments_sector_2(),
                            dto.getSegments_sector_3()))
                    .toList();

            // Save everything into Supabase in a high-speed batch transaction
            log.info("Successfully cached {} lap entries to Supabase for session {}", mappedLaps.size(), sessionKey);
            return lapRepository.saveAll(mappedLaps);

        } catch (RestClientException e) {
            log.error("Failed to execute sync for session database rows: {}", sessionKey, e);
            return List.of();
        }
    }

    public List<Lap> getCachedSessionLaps(int sessionKey) {
        // 1. Try to load from your Supabase cache layer first
        List<Lap> localRecords = lapRepository.findByIdSessionKey(sessionKey);

        if (!localRecords.isEmpty()) {
            log.info("Cache hit: Loaded {} laps from Supabase for session {}", localRecords.size(), sessionKey);
            return localRecords;
        }

        // 2. Cache miss: Fetch live from OpenF1, save to Supabase, and return
        log.info("Cache miss: Syncing lap data from OpenF1 for session {}", sessionKey);
        return fetchSessionLapTelemetry(sessionKey);
    }

    private DriverResult mapDriverResult(OpenF1SessionResultDto dto) {
        if (dto == null)
            return null;

        // 1. Extract and format the raw value into a displayable string safely
        String latestGap = "0.0";
        Object rawGap = dto.getGap_to_leader();

        String formattedDuration = "—";
        Object rawDuration = dto.getDuration();

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

        if (rawDuration instanceof List<?> list && !list.isEmpty()) {
            // Qualifying: array of [Q1, Q2, Q3] — take the last non-null
            formattedDuration = list.stream()
                    .filter(Objects::nonNull)
                    .reduce((a, b) -> b)
                    .map(Object::toString)
                    .orElse("—");
        } else if (rawDuration != null) {
            formattedDuration = rawDuration.toString();
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
                formattedDuration,
                isDnf,
                isDns,
                isDsq);
    }

    private Integer resolveLatestMeetingKey() {
        try {
            String url = openF1BaseUrl + "/sessions?meeting_key=latest";
            delayBetweenRequests();
            OpenF1SessionDto[] sessions = restTemplate.getForObject(url, OpenF1SessionDto[].class);

            if (sessions == null || sessions.length == 0)
                return null;

            return sessions[0].getMeeting_key();
        } catch (Exception e) {
            log.error("Error resolving latest meeting key", e);
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