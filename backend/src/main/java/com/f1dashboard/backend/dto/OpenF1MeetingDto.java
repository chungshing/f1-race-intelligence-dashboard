package com.f1dashboard.backend.dto;

import lombok.Data;

@Data
public class OpenF1MeetingDto {
    private Integer meeting_key;
    private String circuit_image;
    private String country_flag;
    private String circuit_type;
}