package com.f1dashboard.backend.model;

import java.util.List;

public class RaceWeekend {

    private Integer meetingKey;
    private String country;
    private String circuit;
    private List<RaceSession> sessions;

    public RaceWeekend(Integer meetingKey, String country, String circuit, List<RaceSession> sessions) {
        this.meetingKey = meetingKey;
        this.country = country;
        this.circuit = circuit;
        this.sessions = sessions;
    }

    public Integer getMeetingKey() {
        return meetingKey;
    }

    public String getCountry() {
        return country;
    }

    public String getCircuit() {
        return circuit;
    }

    public List<RaceSession> getSessions() {
        return sessions;
    }
}