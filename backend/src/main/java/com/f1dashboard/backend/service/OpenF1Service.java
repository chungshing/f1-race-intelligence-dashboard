package com.f1dashboard.backend.service;

import com.f1dashboard.backend.dto.OpenF1ChampionshipDto;
import com.f1dashboard.backend.dto.OpenF1DriverDto;
import com.f1dashboard.backend.model.DriverStanding;
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

                        String name = driver != null
                                ? driver.getFullName()
                                : "Driver " + s.getDriverNumber();

                        String team = driver != null
                                ? driver.getTeamName()
                                : "Unknown";

                        return new DriverStanding(
                                s.getPositionCurrent(),
                                name,
                                team,
                                s.getPointsCurrent());
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
                new DriverStanding(1, "Max Verstappen", "Red Bull", 25),
                new DriverStanding(2, "Charles Leclerc", "Ferrari", 18),
                new DriverStanding(3, "Lando Norris", "McLaren", 15),
                new DriverStanding(4, "Lewis Hamilton", "Mercedes", 12));
    }

    // fallback if driver metadata missing
    private List<DriverStanding> mapWithoutEnrichment(OpenF1ChampionshipDto[] standings) {
        return Arrays.stream(standings)
                .map(s -> new DriverStanding(
                        s.getPositionCurrent(),
                        "Driver " + s.getDriverNumber(),
                        "Unknown",
                        s.getPointsCurrent()))
                .sorted(Comparator.comparingInt(DriverStanding::getPosition))
                .toList();
    }
}