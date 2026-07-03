package com.f1dashboard.backend.dto;

import lombok.Data;

@Data
public class OpenF1WeatherDto {
    private Double air_temperature;
    private String date;
    private Integer humidity;
    private Integer meeting_key;
    private Double pressure;
    private Integer rainfall;
    private Integer session_key;
    private Double track_temperature;
    private Integer wind_direction;
    private Double wind_speed;
}