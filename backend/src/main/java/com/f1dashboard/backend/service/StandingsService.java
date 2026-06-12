package com.f1dashboard.backend.service;

import com.f1dashboard.backend.model.DriverStanding;
import com.f1dashboard.backend.model.TeamStanding;
import com.f1dashboard.backend.repository.DriverStandingRepository;
import com.f1dashboard.backend.repository.TeamStandingRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class StandingsService {

    private final DriverStandingRepository driverRepository;
    private final TeamStandingRepository teamRepository;

    public StandingsService(DriverStandingRepository driverRepository, TeamStandingRepository teamRepository) {
        this.driverRepository = driverRepository;
        this.teamRepository = teamRepository;
    }

    public List<DriverStanding> getStandings() {
        return driverRepository.findAll(Sort.by(Sort.Direction.ASC, "position"));
    }

    public List<TeamStanding> getTeamStandings() {
        return teamRepository.findAll(Sort.by(Sort.Direction.ASC, "position"));
    }
}