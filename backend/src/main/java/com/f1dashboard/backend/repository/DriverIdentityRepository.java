package com.f1dashboard.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.f1dashboard.backend.model.DriverIdentity;

public interface DriverIdentityRepository extends JpaRepository<DriverIdentity, Integer> {
}