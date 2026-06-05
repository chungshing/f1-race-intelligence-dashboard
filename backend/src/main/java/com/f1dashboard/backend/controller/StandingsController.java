package com.f1dashboard.backend.controller;

import com.f1dashboard.backend.model.DriverStanding;
import com.f1dashboard.backend.model.TeamStanding;
import com.f1dashboard.backend.service.StandingsService;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class StandingsController {

    private final StandingsService standingsService;

    public StandingsController(StandingsService standingsService) {
        this.standingsService = standingsService;
    }

    @Cacheable(value = "standings")
    @GetMapping("/standings")
    public List<DriverStanding> getStandings() {
        return standingsService.getStandings();
    }

    @Cacheable(value = "teamStandings")
    @GetMapping("/teams")
    public List<TeamStanding> getTeamStandings() {
        return standingsService.getTeamStandings();
    }
}