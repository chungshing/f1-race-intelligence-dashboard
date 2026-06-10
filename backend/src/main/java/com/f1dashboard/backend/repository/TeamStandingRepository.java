package com.f1dashboard.backend.repository;

import com.f1dashboard.backend.model.TeamStanding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TeamStandingRepository extends JpaRepository<TeamStanding, String> {
}