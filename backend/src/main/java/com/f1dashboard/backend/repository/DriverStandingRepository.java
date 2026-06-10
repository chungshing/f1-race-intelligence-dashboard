package com.f1dashboard.backend.repository;

import com.f1dashboard.backend.model.DriverStanding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DriverStandingRepository extends JpaRepository<DriverStanding, Integer> {
}