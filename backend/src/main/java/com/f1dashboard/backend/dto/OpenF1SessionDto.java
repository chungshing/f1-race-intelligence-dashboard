package com.f1dashboard.backend.dto;

import lombok.Data;

@Data
public class OpenF1SessionDto {

    private Integer meeting_key;
    private Integer session_key;

    private String country_name;
    private String circuit_short_name;

    private String session_name;
    private String session_type;

    private String date_start;
    private String date_end;
}