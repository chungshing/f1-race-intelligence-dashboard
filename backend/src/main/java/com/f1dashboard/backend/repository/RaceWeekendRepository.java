package com.f1dashboard.backend.repository;
import com.f1dashboard.backend.model.RaceWeekend;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RaceWeekendRepository extends JpaRepository<RaceWeekend, Integer> {
    List<RaceWeekend> findByYear(int year); // Extends filtering capabilities
}