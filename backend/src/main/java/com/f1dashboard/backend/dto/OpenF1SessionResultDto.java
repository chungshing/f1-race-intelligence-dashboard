package com.f1dashboard.backend.dto;

import lombok.Data;

@Data
public class OpenF1SessionResultDto {
    private boolean dnf;
    private boolean dns;
    private boolean dsq;

    private int driver_number;
    private Object duration;
    private Object gap_to_leader;

    private int number_of_laps;
    private int meeting_key;
    private int position;
    private int session_key;
}