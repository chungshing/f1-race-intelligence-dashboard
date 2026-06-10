package com.f1dashboard.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor // Kept for JPA
@Entity
@Table(name = "driver_standings")
public class DriverStanding {

    @Id
    private int driverNumber; // Unique natural ID
    private int position;
    private String driverName;
    private String teamName;
    private int points;
    private String teamColor;
    private String headshotUrl;

    public DriverStanding(int position, String driverName, String teamName, int points, int driverNumber,
            String teamColor, String headshotUrl) {
        this.position = position;
        this.driverName = driverName;
        this.teamName = teamName;
        this.points = points;
        this.driverNumber = driverNumber;
        this.teamColor = teamColor;
        this.headshotUrl = headshotUrl;
    }
}