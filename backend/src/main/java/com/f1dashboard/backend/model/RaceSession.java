package com.f1dashboard.backend.model;

public class RaceSession {
    private String sessionName;
    private String sessionType;
    private String dateStart;
    private String dateEnd;

    public RaceSession(String sessionName, String sessionType, String dateStart, String dateEnd) {
        this.sessionName = sessionName;
        this.sessionType = sessionType;
        this.dateStart = dateStart;
        this.dateEnd = dateEnd;
    }

    public String getSessionName() {
        return sessionName;
    }

    public String getSessionType() {
        return sessionType;
    }

    public String getDateStart() {
        return dateStart;
    }

    public String getDateEnd() {
        return dateEnd;
    }
}