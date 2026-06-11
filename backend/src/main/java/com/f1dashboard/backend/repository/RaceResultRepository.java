package com.f1dashboard.backend.repository;

import com.f1dashboard.backend.model.RaceResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RaceResultRepository extends JpaRepository<RaceResult, Integer> {
    List<RaceResult> findByMeetingKey(Integer meetingKey);
}