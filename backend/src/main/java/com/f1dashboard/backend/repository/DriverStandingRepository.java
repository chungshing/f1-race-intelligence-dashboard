package com.f1dashboard.backend.repository;

import com.f1dashboard.backend.model.DriverStanding;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DriverStandingRepository extends JpaRepository<DriverStanding, Integer> {
}