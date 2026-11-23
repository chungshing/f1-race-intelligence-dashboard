package com.f1dashboard.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "driver_identity")
public class DriverIdentity {

    @Id
    private int driverNumber;
    private String driverName;
    private String teamName;
    private String teamColor;
    private String headshotUrl;
}