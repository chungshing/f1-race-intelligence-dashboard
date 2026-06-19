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

    @Column(name = "circuit_image")
    private String circuitImage;

    @Column(name = "country_flag")
    private String countryFlag;

    @Column(name = "circuit_type")
    private String circuitType;

    @Convert(converter = RaceSessionJsonConverter.class)
    @Column(name = "sessions_json", columnDefinition = "TEXT")
    private List<RaceSession> sessions = new ArrayList<>();

    public RaceWeekend(Integer meetingKey, String country, String circuit, int year,
            String circuitImage, String countryFlag, String circuitType,
            List<RaceSession> sessions) {
        this.meetingKey = meetingKey;
        this.country = country;
        this.circuit = circuit;
        this.year = year;
        this.circuitImage = circuitImage;
        this.countryFlag = countryFlag;
        this.circuitType = circuitType;
        this.sessions = sessions;
    }
}