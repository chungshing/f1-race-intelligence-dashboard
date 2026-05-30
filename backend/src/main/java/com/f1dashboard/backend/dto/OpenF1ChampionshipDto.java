package com.f1dashboard.backend.dto;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
public class OpenF1ChampionshipDto {

    @JsonProperty("driver_number")
    private int driverNumber;

    @JsonProperty("meeting_key")
    private int meetingKey;

    @JsonProperty("points_current")
    private int pointsCurrent;

    @JsonProperty("points_start")
    private int pointsStart;

    @JsonProperty("position_current")
    private int positionCurrent;

    @JsonProperty("position_start")
    private int positionStart;

    @JsonProperty("session_key")
    private int sessionKey;
}