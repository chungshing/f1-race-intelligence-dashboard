package com.f1dashboard.backend.dto;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
public class OpenF1ChampionshipDto {

    @JsonProperty("driver_number")
    private Integer driverNumber;

    @JsonProperty("meeting_key")
    private Integer meetingKey;

    @JsonProperty("points_current")
    private Integer pointsCurrent;

    @JsonProperty("points_start")
    private Integer pointsStart;

    @JsonProperty("position_current")
    private Integer positionCurrent;

    @JsonProperty("position_start")
    private Integer positionStart;

    @JsonProperty("session_key")
    private Integer sessionKey;
}