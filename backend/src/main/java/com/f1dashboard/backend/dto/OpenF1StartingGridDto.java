package com.f1dashboard.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OpenF1StartingGridDto {

    @JsonProperty("driver_number")
    private Integer driverNumber;

    private Integer position;

    @JsonProperty("lap_duration")
    private Double lapDuration;
}