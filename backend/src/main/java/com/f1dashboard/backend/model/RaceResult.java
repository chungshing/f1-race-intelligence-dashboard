package com.f1dashboard.backend.model;

import java.util.ArrayList;
import java.util.List;

import com.f1dashboard.backend.converter.DriverResultListConverter;
import com.f1dashboard.backend.converter.PitStopListConverter;
import com.f1dashboard.backend.converter.RaceControlEventListConverter;
import com.f1dashboard.backend.converter.StintListConverter;
import com.f1dashboard.backend.converter.WeatherSnapshotListConverter;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
@Table(name = "race_results")
public class RaceResult {

    @Id
    @Column(name = "session_key")
    private Integer sessionKey;

    @Column(name = "meeting_key")
    private Integer meetingKey;

    @Column(name = "country")
    private String country;

    @Column(name = "session_name")
    private String sessionName;

    @Convert(converter = DriverResultListConverter.class)
    @Column(name = "classification_json", columnDefinition = "TEXT")
    private List<DriverResult> classification = new ArrayList<>();

    @Convert(converter = PitStopListConverter.class)
    @Column(name = "pit_stops_json", columnDefinition = "TEXT")
    private List<PitStop> pitStops = new ArrayList<>();

    @Convert(converter = StintListConverter.class)
    @Column(name = "stints_json", columnDefinition = "TEXT")
    private List<Stint> stints = new ArrayList<>();

    @Convert(converter = WeatherSnapshotListConverter.class)
    @Column(name = "weather_json", columnDefinition = "TEXT")
    private List<WeatherSnapshot> weather = new ArrayList<>();

    @Convert(converter = RaceControlEventListConverter.class)
    @Column(name = "race_control_json", columnDefinition = "TEXT")
    private List<RaceControlEvent> raceControl = new ArrayList<>();

    public RaceResult(Integer meetingKey, Integer sessionKey, String country, String sessionName,
            List<DriverResult> classification, List<PitStop> pitStops, List<Stint> stints,
            List<WeatherSnapshot> weather, List<RaceControlEvent> raceControl) {
        this.meetingKey = meetingKey;
        this.sessionKey = sessionKey;
        this.country = country;
        this.sessionName = sessionName;
        this.classification = classification;
        this.pitStops = pitStops;
        this.stints = stints;
        this.weather = weather;
        this.raceControl = raceControl;
    }
}