package com.f1dashboard.backend.service;

import com.f1dashboard.backend.model.DriverStanding;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class StandingsService {

    private final OpenF1Service openF1Service;

    public StandingsService(OpenF1Service openF1Service) {
        this.openF1Service = openF1Service;
    }

    public List<DriverStanding> getStandings() {
        log.info("Fetching driver standings");

        List<DriverStanding> standings = openF1Service.fetchDriverStandings();

        if (standings != null && !standings.isEmpty()) {
            log.info("Successfully retrieved {} drivers from OpenF1 API", standings.size());
            return standings;
        }

        log.warn("Failed to fetch standings from OpenF1 API, returning fallback mock data");
        return getStandingsFallback();
    }

    // Fallback data in case of API failure (MOCK)
    private List<DriverStanding> getStandingsFallback() {
        return List.of(
                new DriverStanding(1, "Max Verstappen", "Red Bull Racing", 0),
                new DriverStanding(2, "Charles Leclerc", "Ferrari", 0),
                new DriverStanding(3, "Lando Norris", "McLaren", 0),
                new DriverStanding(4, "Lewis Hamilton", "Mercedes", 0));
    }
}