package com.f1dashboard.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
@Table(name = "team_standings")
public class TeamStanding {

    @Id
    private String teamName; 
    private int position;
    private int points;

    public TeamStanding(int position, String teamName, int points) {
        this.position = position;
        this.teamName = teamName;
        this.points = points;
    }
}