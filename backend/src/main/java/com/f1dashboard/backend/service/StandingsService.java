package com.f1dashboard.backend.service;

import com.f1dashboard.backend.model.DriverStanding;
import com.f1dashboard.backend.model.TeamStanding;

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
        return openF1Service.fetchDriverStandings();
    }

    public List<TeamStanding> getTeamStandings() {
        return openF1Service.fetchTeamStandings();
    }
}