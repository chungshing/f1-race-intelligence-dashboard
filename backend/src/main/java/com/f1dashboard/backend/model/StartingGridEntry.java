package com.f1dashboard.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StartingGridEntry {
    private Integer position;
    private Integer driverNumber;
    private Double lapDuration;
}