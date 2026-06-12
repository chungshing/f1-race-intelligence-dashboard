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
    private Double gapToLeader;
    private Boolean dnf;
    private Boolean dns;
    private Boolean dsq;
}