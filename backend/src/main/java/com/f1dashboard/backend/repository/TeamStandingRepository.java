package com.f1dashboard.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.f1dashboard.backend.model.TeamStanding;

public interface TeamStandingRepository extends JpaRepository<TeamStanding, String> {
    void deleteAllByTeamNameNotIn(List<String> teamNames);
}