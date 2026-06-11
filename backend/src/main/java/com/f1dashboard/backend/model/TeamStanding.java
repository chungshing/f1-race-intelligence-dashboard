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
    private int positionStart;
    private int positionsGained;
    private int points;
    private int pointsStart;
    private int pointsEarned;

    public TeamStanding(int position, int positionStart, int positionsGained,
            String teamName, int points, int pointsStart, int pointsEarned) {
        this.position = position;
        this.positionStart = positionStart;
        this.positionsGained = positionsGained;
        this.teamName = teamName;
        this.points = points;
        this.pointsStart = pointsStart;
        this.pointsEarned = pointsEarned;
    }
}