package com.f1dashboard.backend.dto;

import lombok.Data;

@Data
public class OpenF1TeamChampionshipDto {

    private Integer meeting_key;
    private Integer points_current;
    private Integer points_start;
    private Integer position_current;
    private Integer position_start;
    private Integer session_key;
    private String team_name;
}