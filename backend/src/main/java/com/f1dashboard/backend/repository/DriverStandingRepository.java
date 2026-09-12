package com.f1dashboard.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.f1dashboard.backend.model.DriverStanding;

public interface DriverStandingRepository extends JpaRepository<DriverStanding, Integer> {
    void deleteAllByDriverNumberNotIn(List<Integer> driverNumbers);
}