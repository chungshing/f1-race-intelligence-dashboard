package com.f1dashboard.backend.dto;

import lombok.Data;

@Data
public class OpenF1SessionResultDto {
    private Boolean dnf;
    private Boolean dns;
    private Boolean dsq;

    private Integer driver_number;
    private Object duration;
    private Object gap_to_leader;

    private Integer number_of_laps;
    private Integer meeting_key;
    private Integer position;
    private Integer session_key;
}