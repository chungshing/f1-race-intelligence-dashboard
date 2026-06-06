package com.f1dashboard.backend.service;

import com.f1dashboard.backend.dto.OpenF1ChampionshipDto;
import com.f1dashboard.backend.dto.OpenF1DriverDto;
import com.f1dashboard.backend.dto.OpenF1SessionDto;
import com.f1dashboard.backend.dto.OpenF1TeamChampionshipDto;
import com.f1dashboard.backend.model.DriverStanding;
import com.f1dashboard.backend.model.RaceSession;
import com.f1dashboard.backend.model.RaceWeekend;
import com.f1dashboard.backend.model.TeamStanding;
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
            log.info("Fetching driver standings from OpenF1...");

            String championshipUrl = openF1BaseUrl + "/championship_drivers?session_key=latest";

            String driversUrl = openF1BaseUrl + "/drivers?session_key=latest";

            OpenF1ChampionshipDto[] standings = restTemplate.getForObject(championshipUrl,
                    OpenF1ChampionshipDto[].class);

            OpenF1DriverDto[] drivers = restTemplate.getForObject(driversUrl, OpenF1DriverDto[].class);

            if (standings == null || standings.length == 0) {
                throw new RuntimeException("No championship data available from OpenF1");
            }

            if (drivers == null || drivers.length == 0) {
                log.warn("Driver metadata missing — returning partial standings");
                return mapWithoutEnrichment(standings);
            }

            Map<Integer, OpenF1DriverDto> driverMap = Arrays.stream(drivers)
                    .collect(Collectors.toMap(
                            OpenF1DriverDto::getDriverNumber,
                            d -> d,
                            (a, b) -> a));

            List<DriverStanding> result = Arrays.stream(standings)
                    .map(s -> {
                        OpenF1DriverDto driver = driverMap.get(s.getDriverNumber());

                        return new DriverStanding(
                                s.getPositionCurrent(),
                                driver != null ? driver.getFullName() : "Driver " + s.getDriverNumber(),
                                driver != null ? driver.getTeamName() : "Unknown",
                                s.getPointsCurrent(),
                                s.getDriverNumber(),
                                driver != null ? driver.getTeamColour() : "#999999",
                                driver != null ? driver.getHeadshotUrl() : null);
                    })
                    .sorted(Comparator.comparingInt(DriverStanding::getPosition))
                    .toList();

            log.info("Driver standings fetched successfully ({} drivers)", result.size());
            return result;

        } catch (RestClientException e) {
            log.warn("OpenF1 blocked request (live session or restricted access)");

            return List.of(
                    new DriverStanding(
                            0,
                            "Data temporarily unavailable",
                            "OpenF1 Restricted",
                            0,
                            0,
                            "#999999",
                            null));
        }
    }

    // =========================================================
    // TEAM STANDINGS
    // =========================================================
    public List<TeamStanding> fetchTeamStandings() {

        try {
            log.info("Fetching team standings from OpenF1...");

            String url = openF1BaseUrl + "/championship_teams?session_key=latest";

            OpenF1TeamChampionshipDto[] teams = restTemplate.getForObject(url, OpenF1TeamChampionshipDto[].class);

            if (teams == null || teams.length == 0) {
                throw new RuntimeException("No team championship data available from OpenF1");
            }

            return Arrays.stream(teams)
                    .map(team -> new TeamStanding(
                            team.getPosition_current(),
                            team.getTeam_name(),
                            team.getPoints_current()))
                    .sorted(Comparator.comparingInt(TeamStanding::getPosition))
                    .toList();

        } catch (RestClientException e) {
            log.warn("OpenF1 blocked request (live session or restricted access)");

            return List.of(
                    new TeamStanding(
                            0,
                            "Data temporarily unavailable",
                            0));
        }
    }

    // =========================================================
    // FALLBACK (ONLY if driver metadata missing)
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
                .sorted(Comparator.comparingInt(DriverStanding::getPosition))
                .toList();
    }

    // Fetch all sessions for a given year, grouped by race weekend
    public List<RaceWeekend> fetchRaceWeekends(int year) {

        try {
            log.info("Fetching race sessions from OpenF1...");

            String url = openF1BaseUrl + "/sessions?year=" + year;

            OpenF1SessionDto[] sessions = restTemplate.getForObject(
                    url,
                    OpenF1SessionDto[].class);

            if (sessions == null || sessions.length == 0) {
                log.warn("No session data found");
                return List.of();
            }

            // 1. Group by meeting_key
            Map<Integer, List<OpenF1SessionDto>> grouped = Arrays.stream(sessions)
                    .collect(Collectors.groupingBy(OpenF1SessionDto::getMeeting_key));

            // 2. Build RaceWeekends
            List<RaceWeekend> result = grouped.entrySet().stream()
                    .map(entry -> {

                        Integer meetingKey = entry.getKey();
                        List<OpenF1SessionDto> sessionList = entry.getValue();

                        OpenF1SessionDto first = sessionList.get(0);

                        List<RaceSession> mappedSessions = sessionList.stream()
                                .map(s -> new RaceSession(
                                        s.getSession_name(),
                                        s.getSession_type(),
                                        s.getDate_start(),
                                        s.getDate_end()))
                                .sorted(Comparator.comparing(RaceSession::getDateStart))
                                .toList();

                        return new RaceWeekend(
                                meetingKey,
                                first.getCountry_name(),
                                first.getCircuit_short_name(),
                                mappedSessions);
                    })
                    .sorted(Comparator.comparing(w -> w.getSessions().stream()
                            .map(RaceSession::getDateStart)
                            .min(String::compareTo)
                            .orElse("9999-12-31T00:00:00+00:00")))
                    .toList();

            log.info("Built {} race weekends", result.size());
            return result;

        } catch (Exception e) {
            log.warn("Race API unavailable or restricted - returning empty calendar");

            return List.of();
        }
    }
}