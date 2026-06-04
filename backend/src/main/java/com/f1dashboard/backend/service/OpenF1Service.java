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

    // Base URL with fallback to default if not set in application.properties
    @Value("${openf1.api.baseUrl:https://api.openf1.org/v1}")
    private String openF1BaseUrl;

    private final RestTemplate restTemplate;

    public OpenF1Service(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    // Fetch driver standings with fallback
    public List<DriverStanding> fetchDriverStandings() {
        try {
            log.info("Fetching championship standings from OpenF1...");

            // 1. Championship data (points + position)
            String championshipUrl = openF1BaseUrl + "/championship_drivers?session_key=latest";

            OpenF1ChampionshipDto[] standings = restTemplate.getForObject(championshipUrl,
                    OpenF1ChampionshipDto[].class);

            if (standings == null || standings.length == 0) {
                log.warn("No championship data found, returning fallback");
                return fallbackStandings();
            }

            // 2. Driver metadata (name + team)
            String driversUrl = openF1BaseUrl + "/drivers?session_key=latest";

            OpenF1DriverDto[] drivers = restTemplate.getForObject(driversUrl, OpenF1DriverDto[].class);

            if (drivers == null || drivers.length == 0) {
                log.warn("No driver metadata found, using partial data");
                return mapWithoutEnrichment(standings);
            }

            // 3. Build lookup map (driver_number → driver info)
            Map<Integer, OpenF1DriverDto> driverMap = Arrays.stream(drivers)
                    .collect(Collectors.toMap(
                            OpenF1DriverDto::getDriverNumber,
                            d -> d,
                            (a, b) -> a));

            // 4. Merge datasets
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

            log.info("Successfully built {} driver standings", result.size());
            return result;

        } catch (RestClientException e) {
            log.error("OpenF1 API failed, using fallback data", e);
            return fallbackStandings();
        }
    }

    // fallback if API fails
    private List<DriverStanding> fallbackStandings() {
        return List.of(
                new DriverStanding(1, "Max Verstappen", "Red Bull", 25, 1, "#0600EF", null),
                new DriverStanding(2, "Charles Leclerc", "Ferrari", 18, 16, "#DC0000", null),
                new DriverStanding(3, "Lando Norris", "McLaren", 15, 4, "#FF8700", null),
                new DriverStanding(4, "Lewis Hamilton", "Mercedes", 12, 44, "#00D2BE", null));
    }

    // fallback if driver metadata missing
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

    // Fetch team standings with fallback
    public List<TeamStanding> fetchTeamStandings() {

        try {

            String url = openF1BaseUrl + "/championship_teams?session_key=latest";

            OpenF1TeamChampionshipDto[] teams = restTemplate.getForObject(
                    url,
                    OpenF1TeamChampionshipDto[].class);

            if (teams == null || teams.length == 0) {
                return fallbackTeamStandings();
            }

            return Arrays.stream(teams)
                    .map(team -> new TeamStanding(
                            team.getPosition_current(),
                            team.getTeam_name(),
                            team.getPoints_current()))
                    .sorted(Comparator.comparingInt(TeamStanding::getPosition))
                    .toList();

        } catch (Exception e) {

            log.error("Failed to fetch team standings", e);

            return fallbackTeamStandings();
        }
    }

    //  fallback if API fails or returns empty data
    private List<TeamStanding> fallbackTeamStandings() {

        return List.of(
                new TeamStanding(1, "McLaren", 833),
                new TeamStanding(2, "Ferrari", 652),
                new TeamStanding(3, "Mercedes", 589),
                new TeamStanding(4, "Red Bull", 512));
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
                            .orElse("")))
                    .toList();

            log.info("Built {} race weekends", result.size());
            return result;

        } catch (Exception e) {
            log.error("Failed to fetch race sessions", e);
            return List.of();
        }
    }
}