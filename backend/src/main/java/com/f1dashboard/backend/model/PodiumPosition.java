package com.f1dashboard.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PodiumPosition {
    private int position;
    private int driverNumber;
    private double gapToLeader;
}