package com.f1dashboard.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TeamStanding {

    private int position;
    private String teamName;
    private int points;
}