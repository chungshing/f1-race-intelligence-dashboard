package com.f1dashboard.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.f1dashboard.backend.model.Lap;
import com.f1dashboard.backend.model.LapId;

public interface LapRepository extends JpaRepository<Lap, LapId> {
    List<Lap> findByIdSessionKey(int sessionKey);

    @Modifying
    @Query("DELETE FROM Lap l WHERE l.id.sessionKey NOT IN :activeKeys")
    void deleteBySessionKeyNotIn(@Param("activeKeys") List<Integer> activeKeys);

    @Query("SELECT l.id.sessionKey, MIN(l.dateStart) FROM Lap l GROUP BY l.id.sessionKey")
    List<Object[]> findSessionKeysWithEarliestDate();
}