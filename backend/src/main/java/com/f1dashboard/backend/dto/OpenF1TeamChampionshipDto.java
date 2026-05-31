package com.f1dashboard.backend.dto;

import lombok.Data;

@Data
public class OpenF1TeamChampionshipDto {

    private int meeting_key;
    private int points_current;
    private int points_start;
    private int position_current;
    private int position_start;
    private int session_key;
    private String team_name;
}