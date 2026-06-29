package com.f1dashboard.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriverResult {
    private Integer position;
    private Integer driverNumber;
    private String gapToLeader;
    private String formattedDuration;
    private boolean dnf;
    private boolean dns;
    private boolean dsq;
}