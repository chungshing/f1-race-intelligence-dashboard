package com.f1dashboard.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PitStop {
    @JsonProperty("driver_number")
    private Integer driverNumber;

    @JsonProperty("lap_number")
    private Integer lapNumber;

    @JsonProperty("date")
    private String date;

    @JsonProperty("lane_duration")
    private Double laneDuration;

    @JsonProperty("stop_duration")
    private Double stopDuration;
}