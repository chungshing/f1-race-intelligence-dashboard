package com.f1dashboard.backend.model;

import com.f1dashboard.backend.converter.RaceSessionJsonConverter;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Entity
@Table(name = "race_weekends")
public class RaceWeekend {

    @Id
    @Column(name = "meeting_key")
    private Integer meetingKey;

    private String country;
    private String circuit;
    private int year;

    @Convert(converter = RaceSessionJsonConverter.class)
    @Column(name = "sessions_json", columnDefinition = "TEXT")
    private List<RaceSession> sessions = new ArrayList<>();

    // Updated constructor to include year
    public RaceWeekend(Integer meetingKey, String country, String circuit, int year, List<RaceSession> sessions) {
        this.meetingKey = meetingKey;
        this.country = country;
        this.circuit = circuit;
        this.year = year;
        this.sessions = sessions;
    }
}