package com.f1dashboard.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
@Table(name = "driver_standings")
public class DriverStanding {

    @Id
    private int driverNumber;
    private int position;
    private int positionStart;
    private int positionsGained;
    private String driverName;
    private String teamName;
    private int points;
    private int pointsStart;
    private int pointsEarned;
    private String teamColor;
    private String headshotUrl;

    public DriverStanding(int position, int positionStart, int positionsGained, String driverName,
            String teamName, int points, int pointsStart, int pointsEarned,
            int driverNumber, String teamColor, String headshotUrl) {
        this.position = position;
        this.positionStart = positionStart;
        this.positionsGained = positionsGained;
        this.driverName = driverName;
        this.teamName = teamName;
        this.points = points;
        this.pointsStart = pointsStart;
        this.pointsEarned = pointsEarned;
        this.driverNumber = driverNumber;
        this.teamColor = teamColor;
        this.headshotUrl = headshotUrl;
    }
}