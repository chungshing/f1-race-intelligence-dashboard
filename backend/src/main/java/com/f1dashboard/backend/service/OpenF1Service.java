package com.f1dashboard.backend.service;

import com.f1dashboard.backend.dto.*;
import com.f1dashboard.backend.model.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class OpenF1Service {

    @Value("${openf1.api.baseUrl:https://api.openf1.org/v1}")
    private String openF1BaseUrl;

    private final RestTemplate restTemplate;

    public OpenF1Service(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    // =========================================================
    // DRIVER STANDINGS
    // =========================================================
    public List<DriverStanding> fetchDriverStandings() {

        try {
            String championshipUrl = openF1BaseUrl + "/championship_drivers?session_key=latest";
            String driversUrl = openF1BaseUrl + "/drivers?session_key=latest";

            OpenF1ChampionshipDto[] standings = restTemplate.getForObject(championshipUrl,
                    OpenF1ChampionshipDto[].class);

            OpenF1DriverDto[] drivers = restTemplate.getForObject(driversUrl, OpenF1DriverDto[].class);

            if (standings == null || standings.length == 0) {
                return List.of();
            }

            if (drivers == null || drivers.length == 0) {
                return mapWithoutEnrichment(standings);
            }

            Map<Integer, OpenF1DriverDto> driverMap = Arrays.stream(drivers)
                    .collect(Collectors.toMap(
                            OpenF1DriverDto::getDriverNumber,
                            d -> d,
                            (a, b) -> a));

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

            OpenF1TeamChampionshipDto[] teams = restTemplate.getForObject(url, OpenF1TeamChampionshipDto[].class);

            if (teams == null || teams.length == 0) {
                return List.of();
            }

            return Arrays.stream(teams)
                    .map(t -> new TeamStanding(
                            t.getPosition_current(),
                            t.getTeam_name(),
                            t.getPoints_current()))
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

            OpenF1SessionDto[] sessions = restTemplate.getForObject(url, OpenF1SessionDto[].class);

            if (sessions == null || sessions.length == 0) {
                return List.of();
            }

            Map<Integer, List<OpenF1SessionDto>> grouped = Arrays.stream(sessions)
                    .collect(Collectors.groupingBy(OpenF1SessionDto::getMeeting_key));

            return grouped.entrySet().stream()
                    .map(entry -> {
                        List<OpenF1SessionDto> list = entry.getValue();
                        OpenF1SessionDto first = list.get(0);

                        List<RaceSession> mappedSessions = list.stream()
                                .map(s -> new RaceSession(
                                        s.getSession_name(),
                                        s.getSession_type(),
                                        s.getDate_start(),
                                        s.getDate_end()))
                                .sorted(Comparator.comparing(RaceSession::getDateStart))
                                .toList();

                        return new RaceWeekend(
                                entry.getKey(),
                                first.getCountry_name(),
                                first.getCircuit_short_name(),
                                mappedSessions);
                    })
                    .sorted(Comparator.comparing(w -> w.getSessions().stream()
                            .map(RaceSession::getDateStart)
                            .min(String::compareTo)
                            .orElse("9999-12-31")))
                    .toList();

        } catch (Exception e) {
            log.warn("Race calendar unavailable");
            return List.of();
        }
    }

    // =========================================================
    // RACE RESULTS ENTRY POINT
    // =========================================================
    public List<RaceResult> fetchRaceResults(Integer sessionKey) {

        if (sessionKey != null) {
            return fetchSingleSessionResult(sessionKey);
        }

        return fetchLatestRaceResult();
    }

    // =========================================================
    // LATEST RACE RESULT
    // =========================================================
    private List<RaceResult> fetchLatestRaceResult() {

        try {
            // =========================================================
            // 1. GET LATEST RACE SESSION (REAL METADATA)
            // =========================================================
            OpenF1SessionDto[] sessions = restTemplate.getForObject(
                    openF1BaseUrl + "/sessions?session_key=latest",
                    OpenF1SessionDto[].class);

            if (sessions == null || sessions.length == 0) {
                return List.of();
            }

            OpenF1SessionDto latestSession = Arrays.stream(sessions)
                    .filter(s -> s.getDate_start() != null)
                    .max(Comparator.comparing(OpenF1SessionDto::getDate_start))
                    .orElse(null);

            if (latestSession == null) {
                return List.of();
            }

            Integer sessionKey = latestSession.getSession_key();

            // =========================================================
            // 2. GET SESSION RESULTS USING REAL SESSION KEY
            // =========================================================
            OpenF1SessionResultDto[] res = restTemplate.getForObject(
                    openF1BaseUrl + "/session_result?session_key=" + sessionKey,
                    OpenF1SessionResultDto[].class);

            if (res == null || res.length == 0) {
                return List.of();
            }

            // =========================================================
            // 3. PICK TOP 3
            // =========================================================
            Map<Integer, OpenF1SessionResultDto> top3 = Arrays.stream(res)
                    .filter(r -> r.getPosition() <= 3)
                    .collect(Collectors.toMap(
                            OpenF1SessionResultDto::getPosition,
                            r -> r,
                            (a, b) -> a));

            // =========================================================
            // 4. BUILD RESPONSE WITH REAL METADATA
            // =========================================================
            return List.of(new RaceResult(
                    latestSession.getMeeting_key(),
                    sessionKey,
                    latestSession.getCountry_name(),
                    mapPodium(top3.get(1)),
                    mapPodium(top3.get(2)),
                    mapPodium(top3.get(3))));

        } catch (Exception e) {
            log.error("Failed to fetch latest race result", e);
            return List.of();
        }
    }

    // =========================================================
    // SINGLE SESSION RESULT
    // =========================================================
    private List<RaceResult> fetchSingleSessionResult(Integer sessionKey) {

        try {
            OpenF1SessionResultDto[] res = restTemplate.getForObject(
                    openF1BaseUrl + "/session_result?session_key=" + sessionKey,
                    OpenF1SessionResultDto[].class);

            if (res == null || res.length == 0) {
                return List.of();
            }

            OpenF1SessionDto[] sessionArr = restTemplate.getForObject(
                    openF1BaseUrl + "/sessions?session_key=" + sessionKey,
                    OpenF1SessionDto[].class);

            OpenF1SessionDto session = (sessionArr != null && sessionArr.length > 0)
                    ? sessionArr[0]
                    : null;

            Map<Integer, OpenF1SessionResultDto> top3 = Arrays.stream(res)
                    .filter(r -> r.getPosition() <= 3)
                    .collect(Collectors.toMap(
                            OpenF1SessionResultDto::getPosition,
                            r -> r,
                            (a, b) -> a));

            return List.of(new RaceResult(
                    session != null ? session.getMeeting_key() : -1,
                    sessionKey,
                    session != null ? session.getCountry_name() : "Unknown",
                    mapPodium(top3.get(1)),
                    mapPodium(top3.get(2)),
                    mapPodium(top3.get(3))));

        } catch (Exception e) {
            log.error("Single race result fetch failed", e);
            return List.of();
        }
    }

    // =========================================================
    // MAPPER
    // =========================================================
    private PodiumPosition mapPodium(OpenF1SessionResultDto dto) {
        if (dto == null)
            return null;

        List<Double> gaps = normalize(dto.getGap_to_leader());

        Double latestGap = (gaps == null || gaps.isEmpty())
                ? 0.0
                : gaps.get(gaps.size() - 1);

        return new PodiumPosition(
                dto.getPosition(),
                dto.getDriver_number(),
                latestGap);
    }

    private List<Double> normalize(Object value) {

        if (value == null)
            return List.of();

        if (value instanceof List<?> list) {
            return list.stream()
                    .map(v -> ((Number) v).doubleValue())
                    .toList();
        }

        if (value instanceof Number num) {
            return List.of(num.doubleValue());
        }

        return List.of();
    }

    // =========================================================
    // FALLBACK
    // =========================================================
    private List<DriverStanding> mapWithoutEnrichment(OpenF1ChampionshipDto[] standings) {
        return Arrays.stream(standings)
                .map(s -> new DriverStanding(
                        s.getPositionCurrent(),
                        "Driver " + s.getDriverNumber(),
                        "Unknown",
                        s.getPointsCurrent(),
                        s.getDriverNumber(),
                        "#999999",
                        null))
                .toList();
    }
}