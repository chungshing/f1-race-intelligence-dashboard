package com.f1dashboard.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeatherSnapshot {
    private String date;
    private Double airTemperature;
    private Double trackTemperature;
    private Integer humidity;
    private Double pressure;
    private Integer rainfall;
    private Integer windDirection;
    private Double windSpeed;
}