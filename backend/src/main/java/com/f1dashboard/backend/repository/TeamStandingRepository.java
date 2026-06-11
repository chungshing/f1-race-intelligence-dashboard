package com.f1dashboard.backend.repository;

import com.f1dashboard.backend.model.TeamStanding;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamStandingRepository extends JpaRepository<TeamStanding, String> {
}