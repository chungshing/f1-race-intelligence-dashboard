package com.f1dashboard.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RaceControlEvent {
    private String category;
    private String date;
    private Integer driverNumber;
    private String flag;
    private Integer lapNumber;
    private String message;
    private String qualifyingPhase;
    private String scope;
    private Integer sector;
}