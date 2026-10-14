package com.f1dashboard.backend.dto;

import lombok.Data;

@Data
public class OpenF1StartingGridDto {
    private Integer position;
    private Integer driver_number;
    private Double lap_duration;
    private Integer meeting_key;
    private Integer session_key;
}