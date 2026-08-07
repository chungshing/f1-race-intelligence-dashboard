package com.f1dashboard.backend.dto;

import lombok.Data;

@Data
public class OpenF1RaceControlDto {
    private String category;
    private String date;
    private Integer driver_number;
    private String flag;
    private Integer lap_number;
    private Integer meeting_key;
    private String message;
    private String qualifying_phase;
    private String scope;
    private Integer sector;
    private Integer session_key;
}