package com.f1dashboard.backend.model;

import com.f1dashboard.backend.converter.DriverResultListConverter;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

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

    public RaceResult(Integer meetingKey, Integer sessionKey, String country, String sessionName,
            List<DriverResult> classification) {
        this.meetingKey = meetingKey;
        this.sessionKey = sessionKey;
        this.country = country;
        this.sessionName = sessionName;
        this.classification = classification;
    }
}