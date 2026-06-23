package com.f1dashboard.backend.repository;

import com.f1dashboard.backend.model.Lap;
import com.f1dashboard.backend.model.LapId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LapRepository extends JpaRepository<Lap, LapId> {
    List<Lap> findByIdSessionKey(int sessionKey);

    @Modifying
    @Query("DELETE FROM Lap l WHERE l.id.sessionKey NOT IN :activeKeys")
    void deleteBySessionKeyNotIn(@Param("activeKeys") List<Integer> activeKeys);
}