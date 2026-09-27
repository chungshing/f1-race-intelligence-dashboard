package com.f1dashboard.backend.service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.f1dashboard.backend.model.DriverStanding;
import com.f1dashboard.backend.model.RaceResult;
import com.f1dashboard.backend.model.TeamStanding;
import com.f1dashboard.backend.repository.DriverStandingRepository;
import com.f1dashboard.backend.repository.LapRepository;
import com.f1dashboard.backend.repository.RaceResultRepository;
import com.f1dashboard.backend.repository.TeamStandingRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class F1DataWriter {

    private final DriverStandingRepository driverRepo;
    private final TeamStandingRepository teamRepo;
    private final RaceResultRepository raceResultRepo;
    private final LapRepository lapRepo;

    @Value("${lap.retention.sessions:5}")
    private int lapRetentionSessionCount;

    public F1DataWriter(DriverStandingRepository driverRepo,
            TeamStandingRepository teamRepo,
            RaceResultRepository raceResultRepo,
            LapRepository lapRepo) {
        this.driverRepo = driverRepo;
        this.teamRepo = teamRepo;
        this.raceResultRepo = raceResultRepo;
        this.lapRepo = lapRepo;
    }

    @Transactional
    public void writeDriverStandings(List<DriverStanding> drivers) {
        driverRepo.saveAll(drivers);
        List<Integer> currentNumbers = drivers.stream().map(DriverStanding::getDriverNumber).toList();
        driverRepo.deleteAllByDriverNumberNotIn(currentNumbers);
    }

    @Transactional
    public void writeTeamStandings(List<TeamStanding> teams) {
        teamRepo.saveAll(teams);
        List<String> currentNames = teams.stream().map(TeamStanding::getTeamName).toList();
        teamRepo.deleteAllByTeamNameNotIn(currentNames);
    }

    @Transactional
    public void evictStaleLaps(List<Integer> currentSessionKeys) {
        Map<Integer, String> sessionNames = raceResultRepo.findAll().stream()
                .filter(r -> r.getSessionKey() != null && r.getSessionName() != null)
                .collect(Collectors.toMap(RaceResult::getSessionKey, RaceResult::getSessionName, (a, b) -> a));

        List<Integer> retainedHistoricalSessions = lapRepo.findSessionKeysWithEarliestDate().stream()
                .map(row -> Map.entry((Integer) row[0], (OffsetDateTime) row[1]))
                .filter(entry -> !currentSessionKeys.contains(entry.getKey()))
                .filter(entry -> {
                    String name = sessionNames.get(entry.getKey());
                    return name != null && ("Race".equalsIgnoreCase(name) || "Sprint".equalsIgnoreCase(name));
                })
                .sorted(Map.Entry.<Integer, OffsetDateTime>comparingByValue().reversed())
                .limit(lapRetentionSessionCount)
                .map(Map.Entry::getKey)
                .toList();

        Set<Integer> retainedKeys = new HashSet<>(currentSessionKeys);
        retainedKeys.addAll(retainedHistoricalSessions);

        log.info("Evicting stale telemetry. Retaining current weekend plus {} historical race/sprint sessions.",
                retainedHistoricalSessions.size());
        lapRepo.deleteBySessionKeyNotIn(new ArrayList<>(retainedKeys));
    }
}