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
public class Stint {
    @JsonProperty("driver_number")
    private Integer driverNumber;

    @JsonProperty("stint_number")
    private Integer stintNumber;

    @JsonProperty("lap_start")
    private Integer lapStart;

    @JsonProperty("lap_end")
    private Integer lapEnd;

    @JsonProperty("tyre_age_at_start")
    private Integer tyreAgeAtStart;

    @JsonProperty("compound")
    private String compound;
}